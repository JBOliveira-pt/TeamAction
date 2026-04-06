"use server";

import { sql } from "./_shared";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// ── Helper: busca info de menor + responsável ──
async function getMinorInfo(clerkUserId: string) {
    const [user] = await sql<{ id: string }[]>`
        SELECT id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;
    if (!user) return null;

    const [atleta] = await sql<
        {
            user_id: string;
            menor_idade: boolean | null;
            encarregado_educacao: string | null;
            dados_pendentes: Record<string, unknown> | null;
        }[]
    >`
        SELECT user_id, menor_idade, encarregado_educacao, dados_pendentes
        FROM atletas WHERE user_id = ${user.id} LIMIT 1
    `.catch(() => []);

    return {
        userId: user.id,
        isMinor: atleta?.menor_idade === true,
        guardianEmail: atleta?.encarregado_educacao ?? null,
        currentPending: atleta?.dados_pendentes ?? null,
    };
}

// ── Helper: guarda dados pendentes + notifica responsável ──
async function storePendingChanges(
    athleteUserId: string,
    guardianEmail: string,
    clerkUserId: string,
    newChanges: Record<string, unknown>,
    descricao: string,
) {
    // Merge com dados pendentes existentes
    const [current] = await sql<
        { dados_pendentes: Record<string, unknown> | null }[]
    >`
        SELECT dados_pendentes FROM atletas WHERE user_id = ${athleteUserId} LIMIT 1
    `.catch(() => [{ dados_pendentes: null }]);

    const merged = {
        ...(current?.dados_pendentes ?? {}),
        ...newChanges,
        data_pedido: new Date().toISOString(),
    };

    await sql`
        UPDATE atletas
        SET dados_pendentes = ${JSON.stringify(merged)}::jsonb,
            updated_at = NOW()
        WHERE user_id = ${athleteUserId}
    `;

    // Notificar responsável
    const respRows = await sql<{ id: string }[]>`
        SELECT id FROM users WHERE LOWER(email) = LOWER(${guardianEmail}) LIMIT 1
    `.catch(() => []);

    if (respRows[0]) {
        await sql`
            INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
            VALUES (
                gen_random_uuid(),
                (SELECT COALESCE(organization_id, '00000000-0000-0000-0000-000000000000') FROM users WHERE id = ${athleteUserId} LIMIT 1),
                ${respRows[0].id},
                'Aprovação necessária — Alteração de dados',
                ${descricao},
                'aprovacao_responsavel',
                false,
                NOW()
            )
        `.catch(() => {});
    }
}

export async function atualizarPerfilAtleta(
    prevState: { error?: string; success?: boolean; pendente?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean; pendente?: boolean } | null> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { error: "Não autenticado." };

    const telefone = formData.get("telefone")?.toString().trim() || null;
    const morada = formData.get("morada")?.toString().trim() || null;
    const cidade = formData.get("cidade")?.toString().trim() || null;
    const codigoPostal =
        formData.get("codigo_postal")?.toString().trim() || null;
    const pais = formData.get("pais")?.toString().trim() || null;
    const dataNascimento =
        formData.get("data_nascimento")?.toString().trim() || null;
    const maoDominante =
        formData.get("mao_dominante")?.toString().trim() || null;
    const encarregadoEmail =
        formData.get("encarregado_email")?.toString().trim() || null;

    try {
        const minor = await getMinorInfo(clerkUserId);
        if (!minor) return { error: "Utilizador não encontrado." };

        if (minor.isMinor) {
            if (!minor.guardianEmail) {
                return { error: "Não é possível editar sem um responsável associado." };
            }
            // Guardar alterações pendentes — NÃO salvar diretamente
            await storePendingChanges(
                minor.userId,
                minor.guardianEmail,
                clerkUserId,
                {
                    users: { telefone, morada, cidade, codigo_postal: codigoPostal, pais, data_nascimento: dataNascimento },
                    atletas: { mao_dominante: maoDominante, encarregado_educacao: encarregadoEmail },
                },
                "O atleta menor pretende alterar os seus dados pessoais. É necessária a sua aprovação.",
            );
            revalidatePath("/dashboard/atleta/geral");
            return { pendente: true };
        }

        // Adulto — salvar diretamente
        await sql`
            UPDATE users
            SET telefone = ${telefone}, morada = ${morada}, cidade = ${cidade},
                codigo_postal = ${codigoPostal}, pais = ${pais},
                data_nascimento = ${dataNascimento}
            WHERE clerk_user_id = ${clerkUserId}
        `;
        await sql`
            UPDATE atletas
            SET mao_dominante = ${maoDominante}
            WHERE user_id = ${minor.userId}
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao atualizar perfil." };
    }

    revalidatePath("/dashboard/atleta/geral");
    return null;
}

export async function atualizarPerfilTreinador(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { error: "Não autenticado." };

    const nome = formData.get("nome")?.toString().trim() || null;
    const sobrenome = formData.get("sobrenome")?.toString().trim() || null;
    const telefoneRaw = formData.get("telefone")?.toString().trim() || null;
    const morada = formData.get("morada")?.toString().trim() || null;
    const dataNascimento =
        formData.get("data_nascimento")?.toString().trim() || null;

    // Normalizar telefone: guardar apenas os 9 dígitos
    const telefone = telefoneRaw
        ? telefoneRaw.replace(/\D/g, "").replace(/^351/, "").slice(0, 9) || null
        : null;

    const fullName =
        nome && sobrenome
            ? `${nome} ${sobrenome}`.trim()
            : nome || sobrenome || null;

    try {
        await sql`
            UPDATE users
            SET
                name             = COALESCE(${fullName}, name),
                telefone         = ${telefone},
                morada           = ${morada},
                data_nascimento  = ${dataNascimento},
                updated_at       = NOW()
            WHERE clerk_user_id = ${clerkUserId}
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao atualizar perfil." };
    }

    revalidatePath("/dashboard/treinador/perfil");
    return { success: true };
}

export async function aprovarPerfilAtleta(
    minorUserId: string,
): Promise<{ error?: string } | null> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { error: "Não autenticado." };

    try {
        const [guardian] = await sql<{ email: string }[]>`
            SELECT email FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!guardian) return { error: "Utilizador não encontrado." };

        // Ensure the minor is actually linked to this guardian
        const [minor] = await sql<{ id: string }[]>`
            SELECT u.id FROM users u
            INNER JOIN atletas a ON a.user_id = u.id
            WHERE u.id = ${minorUserId}
            AND a.encarregado_educacao = ${guardian.email}
            AND a.menor_idade = true
            LIMIT 1
        `;
        if (!minor) return { error: "Não autorizado." };

        await sql`UPDATE users SET status = 'true' WHERE id = ${minorUserId}`;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao aprovar perfil." };
    }

    revalidatePath("/dashboard/atleta/geral");
    revalidatePath("/dashboard/responsavel/perfil");
    return null;
}

export async function atualizarMeuPerfil(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { error: "Não autenticado." };

    const firstName = formData.get("firstName")?.toString().trim();
    const lastName = formData.get("lastName")?.toString().trim();
    const telefone = formData.get("telefone")?.toString().trim() || null;
    const morada = formData.get("morada")?.toString().trim() || null;
    const cidade = formData.get("cidade")?.toString().trim() || null;
    const codigoPostal =
        formData.get("codigo_postal")?.toString().trim() || null;
    const pais = formData.get("pais")?.toString().trim() || null;
    const dataNascimento =
        formData.get("data_nascimento")?.toString().trim() || null;
    const nif = formData.get("nif")?.toString().trim() || null;
    const nipc = formData.get("nipc")?.toString().trim() || null;
    const iban = formData.get("iban")?.toString().trim() || null;

    if (!firstName) return { error: "Nome é obrigatório." };
    if (!lastName) return { error: "Apelido é obrigatório." };

    const normalizedIban = iban ? iban.replace(/\s/g, "") : null;
    if (normalizedIban && !/^[A-Z]{2}[A-Z0-9]{11,30}$/.test(normalizedIban)) {
        return { error: "IBAN inválido." };
    }

    const fullName = `${firstName} ${lastName}`.trim();

    try {
        // Verificar se é atleta menor de idade ANTES de salvar
        const minor = await getMinorInfo(clerkUserId);

        if (minor?.isMinor) {
            if (!minor.guardianEmail) {
                return { error: "Não é possível editar sem um responsável associado." };
            }
            // Guardar alterações pendentes — NÃO salvar directamente
            await storePendingChanges(
                minor.userId,
                minor.guardianEmail,
                clerkUserId,
                {
                    users: { name: fullName, telefone, morada, cidade, codigo_postal: codigoPostal, pais, data_nascimento: dataNascimento, nif },
                },
                "O atleta menor pretende alterar os seus dados cadastrais. É necessária a sua aprovação.",
            );
            revalidatePath("/dashboard/atleta/perfil");
            return { success: true };
        }

        // Atualiza nome no Clerk (adultos)
        const clerkRes = await fetch(
            `https://api.clerk.com/v1/users/${clerkUserId}`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                }),
            },
        );
        if (!clerkRes.ok) return { error: "Erro ao atualizar nome." };

        // Atualiza DB
        await sql`
            UPDATE users
            SET name = ${fullName},
                telefone = ${telefone},
                morada = ${morada},
                cidade = ${cidade},
                codigo_postal = ${codigoPostal},
                pais = ${pais},
                data_nascimento = ${dataNascimento},
                nif = ${nif},
                updated_at = NOW()
            WHERE clerk_user_id = ${clerkUserId}
        `;

        // Atualiza IBAN e NIPC no clube (se presidente)
        if (normalizedIban !== undefined || nipc !== undefined) {
            await sql`
                UPDATE clubes
                SET iban = COALESCE(${normalizedIban}, iban),
                    nipc = COALESCE(${nipc}, nipc),
                    updated_at = NOW()
                WHERE presidente_user_id = (
                    SELECT id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
                )
            `;
        }
    } catch (error) {
        console.error(error);
        return { error: "Erro ao atualizar perfil." };
    }

    revalidatePath("/dashboard/presidente/perfil");
    revalidatePath("/dashboard/treinador/perfil");
    revalidatePath("/dashboard/atleta/perfil");
    revalidatePath("/dashboard/responsavel/perfil");
    revalidatePath("/dashboard/utilizador/perfil");
    return { success: true };
}

const ATHLETE_HEIGHT_MIN_CM = 100;
const ATHLETE_HEIGHT_MAX_CM = 300;
const ATHLETE_WEIGHT_MIN_KG = 10;
const ATHLETE_WEIGHT_MAX_KG = 300;

export async function atualizarInfoDesportiva(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { error: "Não autenticado." };

    const pesoRaw = formData.get("peso_kg")?.toString().trim() || "";
    const alturaRaw = formData.get("altura_cm")?.toString().trim() || "";
    const maoDominante =
        formData.get("mao_dominante")?.toString().trim() || null;

    // Validação
    let pesoKg: number | null = null;
    if (pesoRaw) {
        pesoKg = parseFloat(pesoRaw);
        if (
            isNaN(pesoKg) ||
            pesoKg < ATHLETE_WEIGHT_MIN_KG ||
            pesoKg > ATHLETE_WEIGHT_MAX_KG
        ) {
            return {
                error: `Peso deve estar entre ${ATHLETE_WEIGHT_MIN_KG} e ${ATHLETE_WEIGHT_MAX_KG} kg.`,
            };
        }
    }

    let alturaCm: number | null = null;
    if (alturaRaw) {
        alturaCm = parseInt(alturaRaw, 10);
        if (
            isNaN(alturaCm) ||
            alturaCm < ATHLETE_HEIGHT_MIN_CM ||
            alturaCm > ATHLETE_HEIGHT_MAX_CM
        ) {
            return {
                error: `Altura deve estar entre ${ATHLETE_HEIGHT_MIN_CM} e ${ATHLETE_HEIGHT_MAX_CM} cm.`,
            };
        }
    }

    if (
        maoDominante &&
        !["direita", "esquerda", "ambidestro"].includes(maoDominante)
    ) {
        return { error: "Mão dominante inválida." };
    }

    try {
        const minor = await getMinorInfo(clerkUserId);
        if (!minor) return { error: "Utilizador não encontrado." };

        if (minor.isMinor) {
            if (!minor.guardianEmail) {
                return { error: "Não é possível editar sem um responsável associado." };
            }
            // Guardar alterações pendentes — NÃO salvar diretamente
            await storePendingChanges(
                minor.userId,
                minor.guardianEmail,
                clerkUserId,
                {
                    users: { peso_kg: pesoKg, altura_cm: alturaCm },
                    atletas: { mao_dominante: maoDominante },
                },
                "O atleta menor pretende alterar as suas informações desportivas (peso, altura, mão dominante). É necessária a sua aprovação.",
            );
            revalidatePath("/dashboard/atleta/perfil");
            return { success: true };
        }

        // Adulto — salvar diretamente
        // Atualizar peso/altura na tabela users (se colunas existirem)
        const userCols = await sql<{ column_name: string }[]>`
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'users'
              AND column_name IN ('peso_kg', 'altura_cm')
        `;
        const colSet = new Set(userCols.map((c) => c.column_name));

        if (colSet.has("peso_kg")) {
            await sql`UPDATE users SET peso_kg = ${pesoKg}, updated_at = NOW() WHERE id = ${minor.userId}`;
        }
        if (colSet.has("altura_cm")) {
            await sql`UPDATE users SET altura_cm = ${alturaCm}, updated_at = NOW() WHERE id = ${minor.userId}`;
        }

        // Atualizar mão dominante na tabela atletas
        await sql`
            UPDATE atletas SET mao_dominante = ${maoDominante} WHERE user_id = ${minor.userId}
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao atualizar informações desportivas." };
    }

    revalidatePath("/dashboard/atleta/perfil");
    return { success: true };
}
