import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function PATCH(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const treinadorUser = await sql<{ id: string; organization_id: string }[]>`
        SELECT id, organization_id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const treinador = treinadorUser[0];
    if (!treinador) return new Response("Utilizador não encontrado.", { status: 404 });

    const body = (await req.json()) as {
        atleta_id: string;
        nome: string;
        posicao?: string | null;
        numero_camisola?: number | null;
        estado: string;
        equipa_id?: string | null;
    };

    if (!body.atleta_id) return new Response("atleta_id obrigatório.", { status: 400 });
    if (!body.nome?.trim()) return new Response("Nome é obrigatório.", { status: 400 });

    const estadosValidos = ["Ativo", "Lesionado", "Suspenso", "Inativo"];
    if (!estadosValidos.includes(body.estado))
        return new Response("Estado inválido.", { status: 400 });

    // Verifica que o atleta pertence à organização do treinador e é fictício (sem user_id)
    const atletaRows = await sql<{ id: string }[]>`
        SELECT id FROM atletas
        WHERE id = ${body.atleta_id}
          AND organization_id = ${treinador.organization_id}
          AND user_id IS NULL
        LIMIT 1
    `;
    if (atletaRows.length === 0)
        return new Response("Atleta não encontrado ou não é fictício.", { status: 404 });

    // Se foi fornecido equipa_id, verifica que pertence à organização
    if (body.equipa_id) {
        const equipaRows = await sql<{ id: string }[]>`
            SELECT id FROM equipas
            WHERE id = ${body.equipa_id}
              AND organization_id = ${treinador.organization_id}
            LIMIT 1
        `;
        if (equipaRows.length === 0)
            return new Response("Equipa inválida.", { status: 403 });
    }

    await sql`
        UPDATE atletas SET
            nome             = ${body.nome.trim()},
            posicao          = ${body.posicao ?? null},
            numero_camisola  = ${body.numero_camisola ?? null},
            estado           = ${body.estado},
            equipa_id        = ${body.equipa_id ?? null},
            updated_at       = NOW()
        WHERE id = ${body.atleta_id}
    `;

    return new Response("ok", { status: 200 });
}
