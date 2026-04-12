// Rota API notificacoes: lista notificacoes nao lidas do utilizador autenticado.
import { fetchNotificacoes } from "@/app/lib/data";
import { requireApiAccountType } from "@/app/lib/api-guards";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const access = await requireApiAccountType();
        if (!access.ok) {
            return NextResponse.json(
                { error: access.error },
                { status: access.status },
            );
        }

        const notificacoes = await fetchNotificacoes();
        const naoLidas = notificacoes.filter((n) => !n.lida);
        return NextResponse.json({
            notificacoes: naoLidas,
            total: naoLidas.length,
        });
    } catch (error) {
        return NextResponse.json({ notificacoes: [], total: 0 });
    }
}
