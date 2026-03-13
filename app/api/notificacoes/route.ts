import { fetchNotificacoes } from "@/app/lib/data";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const notificacoes = await fetchNotificacoes();
        const naoLidas = notificacoes.filter(n => !n.lida);
        return NextResponse.json({
            notificacoes: naoLidas,
            total: naoLidas.length,
        });
    } catch (error) {
        return NextResponse.json({ notificacoes: [], total: 0 });
    }
}
