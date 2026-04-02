import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// Só treinadores independentes (sem clube) podem criar atletas diretamente.
// Se o email fornecido pertence a um utilizador já vinculado a um clube,
// o atleta é criado com estado "Suspenso" e o admin é notificado.
export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const treinadorUser = await sql<{ id: string; organization_id: string; name: string }[]>`
        SELECT id, organization_id, name FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const treinador = treinadorUser[0];
    if (!treinador) return new Response("Utilizador não encontrado.", { status: 404 });
    if (!treinador.organization_id) return new Response("Sem organização associada.", { status: 403 });

    // Verificar que o treinador NÃO tem clube (apenas treinadores independentes podem criar atletas)
    const clubeRows = await sql<{ id: string }[]>`
        SELECT id FROM clubes WHERE organization_id = ${treinador.organization_id} LIMIT 1
    `;
    if (clubeRows.length > 0) {
        return new Response(
            "Treinadores vinculados a um clube não podem criar atletas diretamente. Os atletas são geridos pelo Presidente do clube.",
            { status: 403 }
        );
    }

    const body = await req.json() as {
        nome: string;
        posicao?: string | null;
        numero_camisola?: number | null;
        equipa_id?: string | null;
        equipa_nome?: string | null;
        email?: string | null;
    };

    if (!body.nome?.trim()) return new Response("Nome é obrigatório.", { status: 400 });

    let linkedUserId: string | null = null;
    let suspenso = false;

    // Se foi fornecido um email, verificar se existe na plataforma
    if (body.email?.trim()) {
        const emailNorm = body.email.trim().toLowerCase();
        const userRows = await sql<{ id: string; organization_id: string | null }[]>`
            SELECT id, organization_id FROM users WHERE LOWER(email) = ${emailNorm} LIMIT 1
        `;

        if (userRows.length > 0) {
            const atletaUser = userRows[0];
            linkedUserId = atletaUser.id;

            // Verificar se esse utilizador está vinculado a um clube diferente
            if (atletaUser.organization_id && atletaUser.organization_id !== treinador.organization_id) {
                const atletaTemClube = await sql<{ id: string }[]>`
                    SELECT c.id FROM clubes c
                    WHERE c.organization_id = ${atletaUser.organization_id}
                    LIMIT 1
                `;
                if (atletaTemClube.length > 0) {
                    suspenso = true;
                }
            }
        }
    }

    const estado = suspenso ? "Suspenso" : "Ativo";

    const [novoAtleta] = await sql<{ id: string }[]>`
        INSERT INTO atletas (
            id, nome, posicao, numero_camisola,
            equipa_id, estado, federado,
            organization_id, user_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            ${body.nome.trim()},
            ${body.posicao ?? null},
            ${body.numero_camisola ?? null},
            ${body.equipa_id ?? null},
            ${estado},
            false,
            ${treinador.organization_id},
            ${linkedUserId},
            NOW(), NOW()
        )
        RETURNING id
    `;

    // Notificação ao admin se atleta ficou suspenso por conflito
    if (suspenso) {
        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, lida, created_at)
            VALUES (
                gen_random_uuid(),
                ${treinador.organization_id},
                'Atleta suspenso por conflito de clube',
                ${`O atleta "${body.nome.trim()}" foi criado pelo treinador "${treinador.name}" mas está vinculado a outro clube. O perfil ficou suspenso até resolução.`},
                'Aviso',
                false,
                NOW()
            )
        `.catch(() => {});
    } else {
        // Notificação normal de novo atleta
        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, lida, created_at)
            VALUES (
                gen_random_uuid(),
                ${treinador.organization_id},
                'Novo atleta adicionado',
                ${`O treinador "${treinador.name}" adicionou o atleta "${body.nome.trim()}"${body.equipa_nome ? ` à equipa "${body.equipa_nome}"` : ""}.`},
                'Info',
                false,
                NOW()
            )
        `.catch(() => {});
    }

    return Response.json({ id: novoAtleta.id, suspenso }, { status: 201 });
}
