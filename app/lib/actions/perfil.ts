"use server";

import { sql } from "./_shared";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function atualizarPerfilAtleta(
    prevState: { error?: string } | null,
    formData: FormData,
): Promise<{ error?: string } | null> {
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
        const [user] = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!user) return { error: "Utilizador não encontrado." };

        const [atleta] = await sql<
            { id: string; menor_idade: boolean | null }[]
        >`
            SELECT id, menor_idade FROM atletas WHERE user_id = ${user.id} LIMIT 1
        `;

        if (atleta?.menor_idade) {
            await sql`
                UPDATE users
                SET telefone = ${telefone}, morada = ${morada}, cidade = ${cidade},
                    codigo_postal = ${codigoPostal}, pais = ${pais},
                    data_nascimento = ${dataNascimento},
                    status = 'false'
                WHERE clerk_user_id = ${clerkUserId}
            `;
            await sql`
                UPDATE atletas
                SET mao_dominante = ${maoDominante},
                    encarregado_educacao = ${encarregadoEmail}
                WHERE user_id = ${user.id}
            `;
        } else {
            await sql`
                UPDATE users
                SET telefone = ${telefone}, morada = ${morada}, cidade = ${cidade},
                    codigo_postal = ${codigoPostal}, pais = ${pais},
                    data_nascimento = ${dataNascimento}
                WHERE clerk_user_id = ${clerkUserId}
            `;
            // Update atletas table for mao_dominante
            await sql`
                UPDATE atletas
                SET mao_dominante = ${maoDominante}
                WHERE user_id = ${user.id}
            `;
        }
    } catch (error) {
        console.error(error);
        return { error: "Erro ao atualizar perfil." };
    }

    revalidatePath("/dashboard/atleta/geral");
    return null;
}

export async function atualizarPerfilTreinador(
    prevState: { error?: string } | null,
    formData: FormData,
): Promise<{ error?: string } | null> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { error: "Não autenticado." };

    const nome = formData.get("nome")?.toString().trim() || null;
    const sobrenome = formData.get("sobrenome")?.toString().trim() || null;
    const telefone = formData.get("telefone")?.toString().trim() || null;
    const morada = formData.get("morada")?.toString().trim() || null;
    const dataNascimento =
        formData.get("data_nascimento")?.toString().trim() || null;

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
    return null;
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
    const iban = formData.get("iban")?.toString().trim() || null;

    if (!firstName) return { error: "Nome é obrigatório." };
    if (!lastName) return { error: "Apelido é obrigatório." };

    const normalizedIban = iban ? iban.replace(/\s/g, "") : null;
    if (normalizedIban && !/^[A-Z]{2}[A-Z0-9]{11,30}$/.test(normalizedIban)) {
        return { error: "IBAN inválido." };
    }

    const fullName = `${firstName} ${lastName}`.trim();

    try {
        // Atualiza nome no Clerk
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

        // Atualiza IBAN no clube (se presidente)
        if (normalizedIban !== undefined) {
            await sql`
                UPDATE clubes
                SET iban = ${normalizedIban}, updated_at = NOW()
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
        const [user] = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!user) return { error: "Utilizador não encontrado." };

        // Atualizar peso/altura na tabela users (se colunas existirem)
        const userCols = await sql<{ column_name: string }[]>`
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'users'
              AND column_name IN ('peso_kg', 'altura_cm')
        `;
        const colSet = new Set(userCols.map((c) => c.column_name));

        if (colSet.has("peso_kg")) {
            await sql`UPDATE users SET peso_kg = ${pesoKg}, updated_at = NOW() WHERE id = ${user.id}`;
        }
        if (colSet.has("altura_cm")) {
            await sql`UPDATE users SET altura_cm = ${alturaCm}, updated_at = NOW() WHERE id = ${user.id}`;
        }

        // Atualizar mão dominante na tabela atletas
        await sql`
            UPDATE atletas SET mao_dominante = ${maoDominante} WHERE user_id = ${user.id}
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao atualizar informações desportivas." };
    }

    revalidatePath("/dashboard/atleta/perfil");
    return { success: true };
}
