// Rota API atletas/verificar-email: verifica se um email ja esta associado a um utilizador.
import { auth } from "@clerk/nextjs/server";
import postgres from "postgres";
import { NextRequest } from "next/server";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// Verifica se um email já existe na plataforma (tabela users)
// Retorna: { existe, nome, account_type, menor_idade, responsavel_nome, responsavel_email, responsavel_ativo }
export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const email =
        req.nextUrl.searchParams.get("email")?.trim().toLowerCase() ?? "";
    if (!email) return Response.json({ existe: false });

    const rows = await sql<
        {
            id: string;
            name: string;
            account_type: string | null;
            data_nascimento: string | null;
        }[]
    >`
        SELECT id, name, account_type, data_nascimento FROM users
        WHERE LOWER(email) = ${email}
        LIMIT 1
    `;

    if (rows.length === 0) {
        return Response.json({ existe: false });
    }

    const user = rows[0];
    const result: Record<string, unknown> = {
        existe: true,
        user_id: user.id,
        nome: user.name,
        account_type: user.account_type,
        data_nascimento: user.data_nascimento,
    };

    // Se for atleta, verificar se é menor de idade e obter info do responsável
    if (user.account_type === "atleta") {
        const atletaRows = await sql<
            {
                menor_idade: boolean | null;
                encarregado_educacao: string | null;
            }[]
        >`
            SELECT menor_idade, encarregado_educacao FROM atletas
            WHERE user_id = ${user.id}
            LIMIT 1
        `;

        const atleta = atletaRows[0];
        if (atleta?.menor_idade) {
            result.menor_idade = true;
            result.responsavel_email = atleta.encarregado_educacao ?? null;

            // Verificar se o responsável tem conta ativa na plataforma
            if (atleta.encarregado_educacao) {
                const respRows = await sql<
                    { name: string; account_type: string | null }[]
                >`
                    SELECT name, account_type FROM users
                    WHERE LOWER(email) = ${atleta.encarregado_educacao.trim().toLowerCase()}
                      AND account_type = 'responsavel'
                    LIMIT 1
                `;
                if (respRows.length > 0) {
                    result.responsavel_nome = respRows[0].name;
                    result.responsavel_ativo = true;
                } else {
                    result.responsavel_ativo = false;
                }
            } else {
                result.responsavel_ativo = false;
            }
        }
    }

    return Response.json(result);
}
