// Actions de recibos: criar, enviar e regenerar PDF.
"use server";

import { sql, getOrganizationId } from "@/app/lib/data/_shared";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { uploadImageToR2 } from "@/app/lib/r2-storage";

export async function uploadRecibo(
    _prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
    const organizationId = await getOrganizationId();

    const file = formData.get("ficheiro") as File | null;
    const atletaId = formData.get("atleta_id") as string;
    const mensalidadeId = formData.get("mensalidade_id") as string;
    const amount = formData.get("amount") as string;
    const paymentMethod = formData.get("payment_method") as string;
    const issuerIban = formData.get("issuer_iban") as string;
    const receivedDate = formData.get("received_date") as string;
    const status = (formData.get("status") as string) ?? "pendente";

    if (!atletaId) return { error: "Atleta é obrigatório." };
    if (!mensalidadeId) return { error: "Mensalidade é obrigatória." };
    if (!amount) return { error: "Valor é obrigatório." };
    if (!paymentMethod) return { error: "Método de pagamento é obrigatório." };
    if (!issuerIban) return { error: "IBAN é obrigatório." };
    if (!receivedDate) return { error: "Data de recebimento é obrigatória." };

    let pdfUrl: string | null = null;
    if (file && file.size > 0) {
        if (file.size > 10 * 1024 * 1024)
            return { error: "Ficheiro demasiado grande. Máximo 10MB." };

        const ext = file.name.split(".").pop()?.toUpperCase() ?? "";
        if (!["PDF", "JPG", "JPEG", "PNG"].includes(ext))
            return { error: "Tipo não permitido. Usa PDF, JPG ou PNG." };

        pdfUrl = await uploadImageToR2(file, "recibo", crypto.randomUUID());
    }

    try {
        const { userId: clerkId } = await auth();

        const userResult = await sql`
            SELECT id FROM users WHERE clerk_user_id = ${clerkId}
        `;
        const dbUserId = userResult[0]?.id ?? null;

        const numResult = await sql`
            SELECT COALESCE(MAX(recibo_number), 0) + 1 AS max
            FROM recibos
            WHERE organization_id = ${organizationId}
        `;
        const reciboNumber = numResult[0]?.max ?? 1;

        await sql`
            INSERT INTO recibos (
                recibo_number, mensalidade_id, atleta_id, organization_id,
                created_by, status, received_date, amount,
                payment_method, issuer_iban, pdf_url,
                created_at, updated_at
            ) VALUES (
                ${reciboNumber}, ${mensalidadeId}, ${atletaId}, ${organizationId},
                ${dbUserId}, ${status}, ${receivedDate}, ${Math.round(parseFloat(amount) * 100)},
                ${paymentMethod}, ${issuerIban}, ${pdfUrl},
                NOW(), NOW()
            )
        `;

        revalidatePath("/dashboard/presidente/recibos");
        return { success: true };
    } catch (error) {
        console.error("Erro ao criar recibo:", error);
        return { error: "Erro ao guardar recibo. Tenta novamente." };
    }
}

export async function sendReciboAction(reciboId: string) {
    const organizationId = await getOrganizationId();

    try {
        const { userId: clerkId } = await auth();

        const userResult = await sql`
            SELECT id FROM users WHERE clerk_user_id = ${clerkId}
        `;
        const dbUserId = userResult[0]?.id ?? null;

        await sql`
            UPDATE recibos
            SET
                status = 'enviado_atleta',
                sent_at = NOW(),
                sent_by_user = ${dbUserId}
            WHERE id = ${reciboId}
              AND organization_id = ${organizationId}
        `;

        revalidatePath("/dashboard/presidente/recibos");
    } catch (error) {
        console.error("Erro ao enviar recibo:", error);
        throw new Error("Erro ao enviar recibo. Tenta novamente.");
    }
}
