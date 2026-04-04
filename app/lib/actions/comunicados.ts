"use server";

import { sql, logAction } from "./_shared";
import { auth } from "@clerk/nextjs/server";
import { uploadImageToR2 } from "../r2-storage";
import { getOrganizationId } from "@/app/lib/data";
import { revalidatePath } from "next/cache";

type ComunicadoState = { error?: string; success?: boolean } | null;

export async function criarComunicado(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const organizationId = await getOrganizationId();

    const titulo = formData.get("titulo") as string;
    const conteudo = formData.get("conteudo") as string;
    const destinatarios = formData.get("destinatarios") as string;

    if (!titulo?.trim() || !conteudo?.trim() || !destinatarios?.trim()) {
        return { error: "Preenche todos os campos obrigatÃ³rios." };
    }

    try {
        const { userId: clerkId } = await auth();

        const userResult = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkId}
        `;
        const dbUserId = userResult[0]?.id ?? null;

        await sql`
            INSERT INTO comunicados (titulo, conteudo, destinatarios, criado_por, organization_id, created_at)
            VALUES (${titulo.trim()}, ${conteudo.trim()}, ${destinatarios.trim()}, ${dbUserId}, ${organizationId}, NOW())
        `;

        // NotificaÃ§Ã£o automÃ¡tica
        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
            VALUES (
                gen_random_uuid(),
                ${organizationId},
                'Novo comunicado publicado',
                ${`"${titulo.trim()}" foi enviado para: ${destinatarios.trim()}.`},
                'Info',
                NOW()
            )
        `;

        await logAction(
            clerkId,
            "comunicado_create",
            "/dashboard/presidente/comunicados",
            { titulo: titulo.trim(), destinatarios: destinatarios.trim() },
        );
        revalidatePath("/dashboard/presidente/comunicados");
        revalidatePath("/dashboard/presidente/notificacoes");
        return { success: true };
    } catch (error) {
        console.error("Database Error:", error);
        return { error: "Erro ao enviar comunicado. Tenta novamente." };
    }
}

// ---------- AUTORIZAÃ‡Ã•ES ----------

export async function registarAutorizacao(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const organizationId = await getOrganizationId();

    const autorizadoA = formData.get("autorizado_a") as string;
    const tipoAcao = formData.get("tipo_acao") as string;
    const notas = formData.get("notas") as string | null;

    if (!autorizadoA?.trim() || !tipoAcao?.trim()) {
        return { error: "Preenche todos os campos obrigatÃ³rios." };
    }

    try {
        const { userId: clerkId } = await auth();

        // CORREÃ‡ÃƒO: buscar UUID real da base de dados
        const userResult = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkId}
        `;
        const dbUserId = userResult[0]?.id ?? null;

        await sql`
            INSERT INTO autorizacoes_log (autorizado_a, autorizado_por, tipo_acao, notas, organization_id, created_at)
            VALUES (${autorizadoA.trim()}, ${dbUserId}, ${tipoAcao.trim()}, ${notas?.trim() ?? null}, ${organizationId}, NOW())
        `;

        await logAction(
            clerkId,
            "autorizacao_create",
            "/dashboard/presidente/autorizacoes",
            { autorizado_a: autorizadoA.trim(), tipo_acao: tipoAcao.trim() },
        );
        revalidatePath("/dashboard/presidente/autorizacoes");
        return { success: true };
    } catch (error) {
        console.error("Database Error:", error);
        return { error: "Erro ao registar autorizaÃ§Ã£o." };
    }
}

// ---------- DOCUMENTOS ----------

export async function uploadDocumento(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const organizationId = await getOrganizationId();

    const file = formData.get("ficheiro") as File | null;
    const nome = formData.get("nome") as string;

    if (!file || file.size === 0) return { error: "Seleciona um ficheiro." };
    if (!nome?.trim()) return { error: "Indica um nome para o documento." };

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE)
        return { error: "Ficheiro demasiado grande. MÃ¡ximo 10MB." };

    const extensao = file.name.split(".").pop()?.toUpperCase() ?? "PDF";
    const tiposPermitidos = ["PDF", "XLSX", "DOCX"];
    if (!tiposPermitidos.includes(extensao)) {
        return {
            error: "Tipo de ficheiro nÃ£o permitido. Usa PDF, XLSX ou DOCX.",
        };
    }

    try {
        const { userId: clerkId } = await auth();

        // CORREÃ‡ÃƒO: buscar o UUID real da base de dados
        const userResult = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkId}
        `;
        const dbUserId = userResult[0]?.id ?? null;

        const url = await uploadImageToR2(file, "user", crypto.randomUUID());

        await sql`
            INSERT INTO documentos (nome, tipo, url_r2, uploaded_by, organization_id, created_at)
            VALUES (${nome.trim()}, ${extensao}, ${url}, ${dbUserId}, ${organizationId}, NOW())
        `;

        revalidatePath("/dashboard/presidente/documentos");
        return { success: true };
    } catch (error) {
        console.error("Database Error:", error);
        return { error: "Erro ao carregar documento. Tenta novamente." };
    }
}
