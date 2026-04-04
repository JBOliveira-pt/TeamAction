"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendRecibo } from "./receipt-service";

export type ReciboFormState = {
    errors: Record<string, string[]>;
    message: string | null;
};

export async function sendReciboAction(reciboId: string) {
    try {
        console.log("sendReciboAction inicializado para:", reciboId);
        const result = await sendRecibo(reciboId);
        console.log(
            "Recibo enviado com sucesso, PDF URL:",
            result?.substring(0, 50) + "...",
        );
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Falha ao enviar recibo.";
        console.error("Erro em sendReciboAction:", message);
        redirect(
            `/dashboard/presidente/recibos/${reciboId}?error=${encodeURIComponent(message)}`,
        );
    }

    revalidatePath("/dashboard/presidente/recibos");
    redirect("/dashboard/presidente/recibos?sent=1");
}
