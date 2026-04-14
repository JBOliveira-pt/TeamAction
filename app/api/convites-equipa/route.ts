// Rota API convites-equipa: listar e criar convites de equipa para atletas.
import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function ensureTable() {
    await sql`
        CREATE TABLE IF NOT EXISTS convites_equipa (
            id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_id UUID        NOT NULL,
            treinador_id    UUID        NOT NULL,
            treinador_nome  TEXT        NOT NULL,
            atleta_id       UUID        NOT NULL,
            equipa_id       UUID,
            equipa_nome     TEXT,
            estado          TEXT        NOT NULL DEFAULT 'pendente',
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;
}

export async function GET() {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await sql<{ id: string; organization_id: string }[]>`
        SELECT id, organization_id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const me = user[0];
    if (!me) return new Response("User not found", { status: 404 });

    await ensureTable();

    const rows = await sql<
        {
            id: string;
            treinador_nome: string;
            atleta_id: string;
            atleta_nome: string;
            equipa_nome: string | null;
            estado: string;
            created_at: string;
        }[]
    >`
        SELECT c.id, c.treinador_nome, c.atleta_id,
               a.nome AS atleta_nome, c.equipa_nome, c.estado, c.created_at::text
        FROM convites_equipa c
        JOIN atletas a ON a.id = c.atleta_id
        WHERE c.organization_id = ${me.organization_id}
          AND c.estado = 'pendente'
        ORDER BY c.created_at DESC
    `;

    return Response.json(rows);
}

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await sql<
        { id: string; organization_id: string; name: string }[]
    >`
        SELECT id, organization_id, name FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const me = user[0];
    if (!me) return new Response("User not found", { status: 404 });

    const body = (await req.json()) as {
        atleta_id: string;
        equipa_id?: string;
        equipa_nome?: string;
    };

    if (!body.atleta_id)
        return new Response("atleta_id obrigatório.", { status: 400 });

    // Get atleta info
    const atletaRows = await sql<
        {
            id: string;
            nome: string;
            user_id: string | null;
            organization_id: string;
            menor_idade: boolean | null;
            encarregado_educacao: string | null;
            data_nascimento: string | null;
        }[]
    >`
        SELECT id, nome, user_id, organization_id, menor_idade, encarregado_educacao, data_nascimento FROM atletas
        WHERE id = ${body.atleta_id} LIMIT 1
    `;
    const atleta = atletaRows[0];
    if (!atleta) return new Response("Atleta não encontrado.", { status: 404 });

    // Req 3: treinador vinculado a clube só pode convidar atletas do mesmo clube
    const treinadorTemClube = await sql<{ id: string }[]>`
        SELECT id FROM clubes WHERE organization_id = ${me.organization_id} LIMIT 1
    `;
    if (
        treinadorTemClube.length > 0 &&
        atleta.organization_id !== me.organization_id
    ) {
        return new Response(
            "Não é possível convidar atletas de outro clube. Só tens acesso aos atletas da tua organização.",
            { status: 403 },
        );
    }

    await ensureTable();

    // Check if already has a pending invite (incluindo pendente_responsavel)
    const existing = await sql<{ id: string }[]>`
        SELECT id FROM convites_equipa
        WHERE atleta_id = ${body.atleta_id}
          AND organization_id = ${me.organization_id}
          AND estado IN ('pendente', 'pendente_responsavel')
        LIMIT 1
    `;
    if (existing.length > 0)
        return new Response("Já existe um convite pendente para este atleta.", {
            status: 409,
        });

    // Validar: atleta não pode pertencer a outra equipa
    if (body.equipa_id) {
        const [atletaEquipa] = await sql<{ equipa_id: string | null }[]>`
            SELECT equipa_id FROM atletas WHERE id = ${body.atleta_id} LIMIT 1
        `;
        if (
            atletaEquipa?.equipa_id &&
            atletaEquipa.equipa_id !== body.equipa_id
        ) {
            return new Response(
                "Este atleta já pertence a outra equipa. Tem de ser removido da equipa atual primeiro.",
                { status: 409 },
            );
        }
    }

    const equipaId = body.equipa_id || null;
    const equipaNome = body.equipa_nome?.trim() || null;

    // Determinar se atleta é menor de idade
    let isMenor = false;
    if (atleta.menor_idade === true) {
        isMenor = true;
    } else if (atleta.data_nascimento) {
        const birth = new Date(atleta.data_nascimento);
        const today = new Date();
        let idade = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) idade--;
        if (idade < 18) {
            isMenor = true;
            // Garantir que menor_idade está set no registo do atleta para fetchAprovacoesPendentes()
            await sql`
                UPDATE atletas SET menor_idade = true, updated_at = NOW()
                WHERE id = ${body.atleta_id} AND (menor_idade IS NULL OR menor_idade = false)
            `.catch(() => {});
        }
    }

    // Buscar user_id do responsável (se menor)
    let responsavelUserId: string | null = null;
    if (isMenor && atleta.encarregado_educacao) {
        const [respUser] = await sql<{ id: string }[]>`
            SELECT id FROM users
            WHERE LOWER(email) = ${atleta.encarregado_educacao.trim().toLowerCase()}
              AND account_type = 'responsavel'
            LIMIT 1
        `.catch(() => []);
        responsavelUserId = respUser?.id ?? null;
    }

    const conviteEstado = isMenor ? "pendente_responsavel" : "pendente";

    const [convite] = await sql<{ id: string }[]>`
        INSERT INTO convites_equipa (organization_id, treinador_id, treinador_nome, atleta_id, equipa_id, equipa_nome, estado)
        VALUES (${me.organization_id}, ${me.id}, ${me.name}, ${body.atleta_id}, ${equipaId}, ${equipaNome}, ${conviteEstado})
        RETURNING id
    `;

    if (isMenor) {
        if (responsavelUserId) {
            // Notificação ao responsável para aprovar
            await sql`
                INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                VALUES (
                    gen_random_uuid(),
                    ${me.organization_id},
                    ${responsavelUserId},
                    ${`Aprovação necessária: convite para equipa${equipaNome ? ` ${equipaNome}` : ""}`},
                    ${`O treinador "${me.name}" pretende adicionar o atleta menor "${atleta.nome}" à equipa. Como encarregado de educação, a sua aprovação é necessária.`},
                    'convite_equipa',
                    false,
                    NOW()
                )
            `.catch(() => {});
        } else if (atleta.user_id) {
            // Responsável não na plataforma — notificar atleta
            await sql`
                INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                VALUES (
                    gen_random_uuid(),
                    ${me.organization_id},
                    ${atleta.user_id},
                    ${`Convite pendente para a equipa${equipaNome ? ` ${equipaNome}` : ""}`},
                    ${`O treinador "${me.name}" pretende adicioná-lo à equipa. Como é menor de idade, o seu encarregado de educação precisa aprovar o convite. Peça ao seu responsável para se registar na plataforma.`},
                    'convite_equipa',
                    false,
                    NOW()
                )
            `.catch(() => {});
        }
    } else if (atleta.user_id) {
        // Adulto: notificação direta ao atleta
        const titulo = `Convite para a equipa${equipaNome ? ` ${equipaNome}` : ""}`;
        const descricao = `Parabéns! O treinador "${me.name}" quer que se junte à equipa${equipaNome ? ` "${equipaNome}"` : ""} como atleta!`;

        await sql`
            INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
            VALUES (
                gen_random_uuid(),
                ${me.organization_id},
                ${atleta.user_id},
                ${titulo},
                ${descricao},
                'convite_equipa',
                false,
                NOW()
            )
        `.catch(() => {});
    }

    return Response.json(
        { id: convite.id, atleta_nome: atleta.nome },
        { status: 201 },
    );
}
