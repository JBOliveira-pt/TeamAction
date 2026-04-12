// Serviço de recibos: geração de PDF e registo em base de dados.
import postgres from "postgres";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "./auth-helpers";
import { uploadReceiptPdfToR2 } from "./r2-storage";
import {
    generateReciboPdf,
    type ReciboPdfData,
} from "@/app/components/receipt-pdf";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const PAYMENT_METHOD = "Transferencia bancaria";

function toDateString(date: Date) {
    return date.toISOString().split("T")[0];
}

async function generateReciboNumber(): Promise<number> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidate = Math.floor(100000 + Math.random() * 900000);
        const exists = await sql<{ id: string }[]>`
            SELECT id FROM recibos WHERE recibo_number = ${candidate}
        `;

        if (exists.length === 0) {
            return candidate;
        }
    }

    throw new Error("Falha ao gerar numero de recibo");
}

function ensureNotFuture(dateStr: string) {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) {
        throw new Error("Data de recebimento nao pode ser futura.");
    }
}

const MESES_NOMES: Record<string, string> = {
    "1": "Janeiro",
    "2": "Fevereiro",
    "3": "Marco",
    "4": "Abril",
    "5": "Maio",
    "6": "Junho",
    "7": "Julho",
    "8": "Agosto",
    "9": "Setembro",
    "10": "Outubro",
    "11": "Novembro",
    "12": "Dezembro",
};

/**
 * Cria um recibo quando uma mensalidade e marcada como paga.
 * Chamado a partir de registarPagamento() em actions.ts.
 */
export async function createReciboForPaidMensalidade(
    mensalidadeId: string,
    atletaId: string,
    organizationId: string,
    valor: number,
    mes: string,
    ano: string,
    dataPagamento: string | null,
    createdByUserId: string,
) {
    // Verificar se ja existe recibo para esta mensalidade
    const existingRecibo = await sql<
        { id: string }[]
    >`SELECT id FROM recibos WHERE mensalidade_id = ${mensalidadeId}`;

    if (existingRecibo.length > 0) {
        return existingRecibo[0].id;
    }

    // Buscar IBAN do clube
    const clubeRows = await sql<
        { iban: string | null }[]
    >`SELECT iban FROM clubes WHERE organization_id = ${organizationId} LIMIT 1`;

    const clubeIban = clubeRows[0]?.iban;
    if (!clubeIban) {
        throw new Error(
            "IBAN do clube obrigatorio para criar recibo. Configure o IBAN nas definicoes do clube.",
        );
    }

    const reciboNumber = await generateReciboNumber();
    const today = toDateString(new Date());
    const receivedDate = dataPagamento || today;

    const inserted = await sql<{ id: string }[]>`INSERT INTO recibos (
            recibo_number,
            mensalidade_id,
            atleta_id,
            organization_id,
            created_by,
            status,
            received_date,
            amount,
            payment_method,
            issuer_iban,
            pdf_url,
            sent_at,
            sent_by_user,
            created_at,
            updated_at
        )
        VALUES (
            ${reciboNumber},
            ${mensalidadeId},
            ${atletaId},
            ${organizationId},
            ${createdByUserId},
            'pendente_envio',
            ${receivedDate},
            ${valor},
            ${PAYMENT_METHOD},
            ${clubeIban},
            NULL,
            NULL,
            NULL,
            NOW(),
            NOW()
        )
        RETURNING id
    `;

    const reciboId = inserted[0]?.id || null;
    console.log(
        "Recibo criado: #" +
            reciboNumber +
            " para " +
            MESES_NOMES[mes] +
            "/" +
            ano,
    );
    return reciboId;
}

/**
 * Envia o recibo: gera PDF, faz upload para R2 e atualiza status.
 */
export async function sendRecibo(reciboId: string) {
    console.log("Iniciando envio de recibo:", reciboId);

    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    const reciboRows = await sql<
        {
            id: string;
            recibo_number: number;
            mensalidade_id: string;
            status: "pendente_envio" | "enviado_atleta";
            received_date: string;
            amount: number;
            issuer_iban: string;
            created_by: string | null;
            atleta_id: string;
        }[]
    >`SELECT id, recibo_number, mensalidade_id, status, received_date, amount, issuer_iban, created_by, atleta_id
      FROM recibos WHERE id = ${reciboId}`;

    const recibo = reciboRows[0];
    if (!recibo) {
        throw new Error("Recibo nao encontrado");
    }

    if (recibo.status !== "pendente_envio") {
        throw new Error("Recibo ja foi enviado");
    }

    ensureNotFuture(recibo.received_date);

    // Buscar dados da mensalidade
    const mensalidadeRows = await sql<
        { mes: number; ano: number; data_pagamento: string | null }[]
    >`SELECT mes, ano, data_pagamento FROM mensalidades WHERE id = ${recibo.mensalidade_id}`;

    const mensalidade = mensalidadeRows[0];
    if (!mensalidade) {
        throw new Error("Mensalidade nao encontrada");
    }

    // Buscar dados do atleta
    const atletaRows = await sql<
        { nome: string; user_id: string | null }[]
    >`SELECT nome, user_id FROM atletas WHERE id = ${recibo.atleta_id}`;

    const atleta = atletaRows[0];
    if (!atleta) {
        throw new Error("Atleta nao encontrado");
    }

    // Buscar dados do clube (emissor)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        throw new Error("Utilizador nao encontrado");
    }

    const clubeRows = await sql<
        {
            nome: string;
            nipc: string | null;
            morada: string | null;
            cidade: string | null;
        }[]
    >`SELECT nome, nipc, morada, cidade FROM clubes WHERE organization_id = ${currentUser.organization_id} LIMIT 1`;

    const clube = clubeRows[0];
    if (!clube) {
        throw new Error("Clube nao encontrado");
    }

    const today = toDateString(new Date());

    const receivedDateStr =
        typeof recibo.received_date === "string"
            ? recibo.received_date
            : toDateString(recibo.received_date as unknown as Date);

    const pdfData: ReciboPdfData = {
        reciboNumber: recibo.recibo_number,
        issueDate: today,
        receivedDate: receivedDateStr,
        clube: {
            nome: clube.nome,
            nipc: clube.nipc,
            morada: clube.morada,
            cidade: clube.cidade,
        },
        atleta: {
            nome: atleta.nome,
        },
        mensalidade: {
            mes: mensalidade.mes,
            ano: mensalidade.ano,
            amount: recibo.amount,
            dataPagamento: mensalidade.data_pagamento,
        },
        issuerIban: recibo.issuer_iban,
    };

    let buffer: Buffer;
    try {
        buffer = await generateReciboPdf(pdfData);
    } catch (pdfError) {
        const errorMsg =
            pdfError instanceof Error ? pdfError.message : String(pdfError);
        console.error("Falha ao gerar PDF:", errorMsg);
        throw new Error("Falha ao gerar PDF: " + errorMsg);
    }

    let pdfUrl: string;
    try {
        pdfUrl = await uploadReceiptPdfToR2(
            buffer,
            recibo.id,
            recibo.recibo_number,
        );
    } catch (uploadError) {
        const errorMsg =
            uploadError instanceof Error
                ? uploadError.message
                : String(uploadError);
        console.error("Falha ao fazer upload do PDF:", errorMsg);
        throw new Error("Falha ao fazer upload do PDF: " + errorMsg);
    }

    try {
        await sql`
            UPDATE recibos
            SET status = 'enviado_atleta',
                pdf_url = ${pdfUrl},
                sent_at = now(),
                sent_by_user = ${currentUser.id},
                updated_at = now()
            WHERE id = ${recibo.id}
        `;
        console.log("Recibo enviado: #" + recibo.recibo_number);
    } catch (dbError) {
        const errorMsg =
            dbError instanceof Error ? dbError.message : String(dbError);
        console.error("Falha ao atualizar recibo:", errorMsg);
        throw new Error("Falha ao atualizar recibo: " + errorMsg);
    }

    return pdfUrl;
}
