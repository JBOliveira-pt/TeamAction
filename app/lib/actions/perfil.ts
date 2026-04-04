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
        const [user] = await sql<{ id: string; menor_idade: boolean | null }[]>`
            SELECT id, "Menor_idade" AS menor_idade FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!user) return { error: "Utilizador não encontrado." };

        if (user.menor_idade) {
            await sql`
                UPDATE users
                SET telefone = ${telefone}, morada = ${morada}, cidade = ${cidade},
                    codigo_postal = ${codigoPostal}, pais = ${pais},
                    data_nascimento = ${dataNascimento},
                    "Encarregado_Edu" = ${encarregadoEmail},
                    status = 'false'
                WHERE clerk_user_id = ${clerkUserId}
            `;
        } else {
            await sql`
                UPDATE users
                SET telefone = ${telefone}, morada = ${morada}, cidade = ${cidade},
                    codigo_postal = ${codigoPostal}, pais = ${pais},
                    data_nascimento = ${dataNascimento}
                WHERE clerk_user_id = ${clerkUserId}
            `;
        }

        // Update atletas table for fields stored there
        await sql`
            UPDATE atletas
            SET mao_dominante = ${maoDominante}
            WHERE user_id = ${user.id}
        `;
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
            SELECT id FROM users
            WHERE id = ${minorUserId}
            AND "Encarregado_Edu" = ${guardian.email}
            AND "Menor_idade" = true
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
    if (!clerkUserId) return { error: "NÃ£o autenticado." };

    const firstName = formData.get("firstName")?.toString().trim();
    const lastName = formData.get("lastName")?.toString().trim();
    const iban = formData.get("iban")?.toString().trim() || null;

    if (!firstName) return { error: "Nome Ã© obrigatÃ³rio." };
    if (!lastName) return { error: "Apelido Ã© obrigatÃ³rio." };

    const normalizedIban = iban ? iban.replace(/\s/g, "") : null;
    if (normalizedIban && !/^[A-Z]{2}[A-Z0-9]{11,30}$/.test(normalizedIban)) {
        return { error: "IBAN invÃ¡lido." };
    }

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
            SET name = ${`${firstName} ${lastName}`.trim()}, iban = ${normalizedIban}
            WHERE clerk_user_id = ${clerkUserId}
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao atualizar perfil." };
    }

    revalidatePath("/dashboard/presidente/perfil");
    return { success: true };
}
