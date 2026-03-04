"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendReceipt, updateReceiptDetails } from "./receipt-service";

const ReceiptDetailsSchema = z.object({
    activityCode: z.string().min(1, {
        message: "Selecione uma atividade exercida.",
    }),
    receivedDate: z
        .string()
        .min(1, { message: "Informe a data de recebimento." }),
});

export type ReceiptFormState = {
    errors: {
        activityCode?: string[];
        receivedDate?: string[];
    };
    message: string | null;
};

export async function updateReceiptDetailsAction(
    receiptId: string,
    prevState: ReceiptFormState,
    formData: FormData,
): Promise<ReceiptFormState> {
    const validatedFields = ReceiptDetailsSchema.safeParse({
        activityCode: formData.get("activityCode"),
        receivedDate: formData.get("receivedDate"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Campos obrigatorios em falta.",
        };
    }

    const { activityCode, receivedDate } = validatedFields.data;

    try {
        await updateReceiptDetails(receiptId, activityCode, receivedDate);
    } catch (error) {
        return {
            errors: {},
            message:
                error instanceof Error
                    ? error.message
                    : "Falha ao atualizar o recibo.",
        };
    }

    revalidatePath(`/dashboard/receipts/${receiptId}`);
    revalidatePath("/dashboard/receipts");
    return { errors: {}, message: null };
}

export async function sendReceiptAction(receiptId: string) {
    try {
        console.log("🚀 sendReceiptAction inicializado para:", receiptId);
        const result = await sendReceipt(receiptId);
        console.log(
            "✅ Recibo enviado com sucesso, PDF URL:",
            result?.substring(0, 50) + "...",
        );
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Falha ao enviar recibo.";
        console.error("❌ Erro em sendReceiptAction:", message);
        redirect(
            `/dashboard/receipts/${receiptId}?error=${encodeURIComponent(message)}`,
        );
    }

    revalidatePath("/dashboard/receipts");
    redirect("/dashboard/receipts?sent=1");
}
