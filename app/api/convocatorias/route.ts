// Rota API convocatorias: listar e gerir convocatórias de atletas para jogos.
import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function getUser(clerkUserId: string) {
    const rows = await sql<
        { id: string; organization_id: string; account_type: string }[]
    >`
        SELECT id, organization_id, account_type FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;
    return rows[0] ?? null;
}

// GET /api/convocatorias?jogo_id=xxx
export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await getUser(userId);
    if (!user) return new Response("User not found", { status: 404 });

    const jogoId = req.nextUrl.searchParams.get("jogo_id");
    if (!jogoId) return new Response("Missing jogo_id", { status: 400 });

    const rows = await sql<
        {
            id: string;
            atleta_id: string;
            estado: string | null;
            nome: string;
            posicao: string | null;
            numero_camisola: number | null;
            created_at: string;
        }[]
    >`
        SELECT c.id, c.atleta_id, c.estado, a.nome, a.posicao, a.numero_camisola, c.created_at::text
        FROM convocatorias c
        JOIN atletas a ON a.id = c.atleta_id
        WHERE c.jogo_id = ${jogoId}
        ORDER BY a.nome ASC
    `;

    return Response.json(rows);
}

// POST /api/convocatorias
// Body: { jogo_id, atletas: [{ atleta_id, estado }] }
export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await getUser(userId);
    if (!user) return new Response("User not found", { status: 404 });

    if (
        user.account_type !== "presidente" &&
        user.account_type !== "treinador"
    ) {
        return new Response("Forbidden", { status: 403 });
    }

    const body = (await req.json()) as {
        jogo_id?: string;
        atletas?: { atleta_id: string; estado: string }[];
    };

    if (!body.jogo_id || !body.atletas?.length) {
        return new Response("Missing jogo_id or atletas", { status: 400 });
    }

    const allowedEstados = ["convocado", "suplente", "dispensado", "lesionado"];
    for (const a of body.atletas) {
        if (!a.atleta_id || !allowedEstados.includes(a.estado)) {
            return new Response(`Estado inválido: ${a.estado}`, {
                status: 400,
            });
        }
    }

    // Verificar que o jogo pertence a esta organização
    const [jogo] = await sql<
        { id: string; equipa_id: string; adversario: string; data: string }[]
    >`
        SELECT id, equipa_id, adversario, data::text FROM jogos
        WHERE id = ${body.jogo_id} AND organization_id = ${user.organization_id}
        LIMIT 1
    `;
    if (!jogo) return new Response("Jogo não encontrado", { status: 404 });

    // Apagar convocatórias existentes deste jogo e inserir novas
    await sql.begin(async (tx: any) => {
        await tx`DELETE FROM convocatorias WHERE jogo_id = ${body.jogo_id!}`;

        for (const a of body.atletas!) {
            await tx`
                INSERT INTO convocatorias (id, jogo_id, atleta_id, estado, created_at)
                VALUES (gen_random_uuid(), ${body.jogo_id!}, ${a.atleta_id}, ${a.estado}, NOW())
            `;
        }

        // Auto-notificação para convocados
        const convocados = body.atletas!.filter(
            (a) => a.estado === "convocado" || a.estado === "suplente",
        );
        if (convocados.length > 0) {
            // Obter user_id de cada atleta convocado
            const atletaIds = convocados.map((a) => a.atleta_id);
            const atletaUsers = await tx`
                SELECT id, user_id FROM atletas WHERE id = ANY(${atletaIds})
            `;
            const userIdMap = new Map(
                atletaUsers.map((a: { id: string; user_id: string }) => [
                    a.id,
                    a.user_id,
                ]),
            );

            for (const a of convocados) {
                const recipientUserId = userIdMap.get(a.atleta_id);
                if (!recipientUserId) continue;

                const estadoLabel =
                    a.estado === "convocado" ? "Convocado" : "Suplente";
                await tx`
                    INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                    VALUES (
                        gen_random_uuid(),
                        ${user.organization_id},
                        ${recipientUserId},
                        ${"Convocatória: " + estadoLabel},
                        ${"Foste " + estadoLabel.toLowerCase() + " para o jogo vs " + jogo.adversario + " em " + jogo.data + "."},
                        'Info',
                        false,
                        NOW()
                    )
                `;
            }
        }
    });

    return Response.json({ ok: true }, { status: 201 });
}
