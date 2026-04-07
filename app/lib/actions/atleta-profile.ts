"use server";

import { sql, logAction, MAX_PHOTO_SIZE } from "./_shared";
import { auth } from "@clerk/nextjs/server";
import { uploadAtletaPhotoToR2 } from "../r2-storage";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { AtletaState } from "../definitions";

// ========================================
// Atleta Actions
// ========================================

const ATHLETE_HEIGHT_MIN_CM = 100;

const ATHLETE_HEIGHT_MAX_CM = 300;

const ATHLETE_WEIGHT_MIN_KG = 10;

const ATHLETE_WEIGHT_MAX_KG = 300;

const ATHLETE_WEIGHT_DECIMALS_REGEX = /^\d+(\.\d{1,2})?$/;

const AtletaFormSchema = z.object({
    nome: z.string().trim().min(1, { message: "Nome Ã© obrigatÃ³rio." }),
    sobrenome: z
        .string()
        .trim()
        .min(1, { message: "Sobrenome Ã© obrigatÃ³rio." }),
    data_nascimento: z
        .string()
        .min(1, { message: "Data de nascimento Ã© obrigatÃ³ria." }),
    morada: z.string().trim().min(1, { message: "Morada Ã© obrigatÃ³ria." }),
    telemovel: z
        .string()
        .trim()
        .min(1, { message: "TelemÃ³vel Ã© obrigatÃ³rio." })
        .regex(/^[\d\s\+\-\(\)]{9,20}$/, { message: "TelemÃ³vel invÃ¡lido." }),
    email: z.string().email({ message: "Email invÃ¡lido." }),
    peso_kg: z
        .string()
        .trim()
        .regex(ATHLETE_WEIGHT_DECIMALS_REGEX, {
            message: "Peso deve ter no mÃ¡ximo 2 casas decimais.",
        })
        .transform((value) => Number(value))
        .refine(
            (value) =>
                !Number.isNaN(value) &&
                value >= ATHLETE_WEIGHT_MIN_KG &&
                value <= ATHLETE_WEIGHT_MAX_KG,
            {
                message: `Peso deve estar entre ${ATHLETE_WEIGHT_MIN_KG} e ${ATHLETE_WEIGHT_MAX_KG} kg.`,
            },
        ),
    altura_cm: z.coerce
        .number({ invalid_type_error: "Altura invÃ¡lida." })
        .min(ATHLETE_HEIGHT_MIN_CM, {
            message: `Altura deve estar entre ${ATHLETE_HEIGHT_MIN_CM} e ${ATHLETE_HEIGHT_MAX_CM} cm.`,
        })
        .max(ATHLETE_HEIGHT_MAX_CM, {
            message: `Altura deve estar entre ${ATHLETE_HEIGHT_MIN_CM} e ${ATHLETE_HEIGHT_MAX_CM} cm.`,
        }),
    nif: z
        .string()
        .trim()
        .regex(/^\d{9}$/, {
            message: "NIF deve ter exatamente 9 dÃ­gitos numÃ©ricos.",
        }),
});

export async function createAtletaProfile(
    prevState: AtletaState,
    formData: FormData,
): Promise<AtletaState> {
    const { userId } = await auth();
    if (!userId) {
        return { errors: {}, message: "NÃ£o autenticado." };
    }

    const validatedFields = AtletaFormSchema.safeParse({
        nome: formData.get("nome"),
        sobrenome: formData.get("sobrenome"),
        data_nascimento: formData.get("data_nascimento"),
        morada: formData.get("morada"),
        telemovel: formData.get("telemovel"),
        email: formData.get("email"),
        peso_kg: formData.get("peso_kg"),
        altura_cm: formData.get("altura_cm"),
        nif: formData.get("nif"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Erro de validaÃ§Ã£o. Verifique os campos.",
        };
    }

    const {
        nome,
        sobrenome,
        data_nascimento,
        morada,
        telemovel,
        email,
        peso_kg,
        altura_cm,
        nif,
    } = validatedFields.data;

    // Handle photo upload
    const fotoFile = formData.get("foto_perfil") as File | null;
    if (!fotoFile || fotoFile.size === 0) {
        return {
            errors: { foto_perfil: ["Foto de perfil Ã© obrigatÃ³ria."] },
            message: "Foto de perfil Ã© obrigatÃ³ria.",
        };
    }
    if (fotoFile.size > MAX_PHOTO_SIZE) {
        return {
            errors: { foto_perfil: ["Foto deve ter menos de 5MB."] },
            message: "Foto muito grande.",
        };
    }

    let foto_perfil_url: string;
    try {
        foto_perfil_url = await uploadAtletaPhotoToR2(
            fotoFile,
            nif,
            nome,
            sobrenome,
        );
    } catch (error) {
        console.error("R2 upload error:", error);
        return {
            errors: {},
            message: "Erro ao fazer upload da foto. Tente novamente.",
        };
    }

    try {
        const usersColumns = await sql<{ column_name: string }[]>`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
        `;

        const hasUsersColumn = (column: string) =>
            usersColumns.some((item) => item.column_name === column);

        const fullName = `${nome} ${sobrenome}`.trim();

        if (hasUsersColumn("name")) {
            await sql`
                UPDATE users
                SET name = ${fullName}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("email")) {
            await sql`
                UPDATE users
                SET email = ${email}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("data_nascimento")) {
            await sql`
                UPDATE users
                SET data_nascimento = ${data_nascimento}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("morada")) {
            await sql`
                UPDATE users
                SET morada = ${morada}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("telefone")) {
            await sql`
                UPDATE users
                SET telefone = ${telemovel}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("peso_kg")) {
            await sql`
                UPDATE users
                SET peso_kg = ${peso_kg}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("altura_cm")) {
            await sql`
                UPDATE users
                SET altura_cm = ${altura_cm}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("nif")) {
            await sql`
                UPDATE users
                SET nif = ${nif}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("status")) {
            await sql`
                UPDATE users
                SET status = 'pendente', updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("image_url")) {
            await sql`
                UPDATE users
                SET image_url = ${foto_perfil_url}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }
    } catch (error: any) {
        if (error.code === "23505") {
            return {
                errors: {},
                message: "JÃ¡ existe um perfil com este email ou NIF.",
            };
        }
        console.error("DB insert atleta error:", error);
        return {
            errors: {},
            message: "Erro ao guardar perfil. Tente novamente.",
        };
    }

    await logAction(
        userId,
        "atleta_profile_create",
        "/dashboard/utilizador/perfil",
        { nome, email, nif },
    );
    revalidatePath("/dashboard/utilizador/perfil");
    redirect("/dashboard/utilizador/perfil");
}

export async function updateAtletaProfile(
    prevState: AtletaState,
    formData: FormData,
): Promise<AtletaState> {
    const { userId } = await auth();
    if (!userId) {
        return { errors: {}, message: "NÃ£o autenticado." };
    }

    const validatedFields = AtletaFormSchema.safeParse({
        nome: formData.get("nome"),
        sobrenome: formData.get("sobrenome"),
        data_nascimento: formData.get("data_nascimento"),
        morada: formData.get("morada"),
        telemovel: formData.get("telemovel"),
        email: formData.get("email"),
        peso_kg: formData.get("peso_kg"),
        altura_cm: formData.get("altura_cm"),
        nif: formData.get("nif"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Erro de validaÃ§Ã£o. Verifique os campos.",
        };
    }

    const {
        nome,
        sobrenome,
        data_nascimento,
        morada,
        telemovel,
        email,
        peso_kg,
        altura_cm,
        nif,
    } = validatedFields.data;

    let foto_perfil_url: string | null = null;

    const existingUser = await sql<{ image_url: string | null }[]>`
        SELECT image_url
        FROM users
        WHERE clerk_user_id = ${userId}
        LIMIT 1
    `;

    if (!existingUser.length) {
        return { errors: {}, message: "Perfil nÃ£o encontrado." };
    }

    foto_perfil_url = existingUser[0].image_url;

    const fotoFile = formData.get("foto_perfil") as File | null;
    if (fotoFile && fotoFile.size > 0) {
        if (fotoFile.size > MAX_PHOTO_SIZE) {
            return {
                errors: { foto_perfil: ["Foto deve ter menos de 5MB."] },
                message: "Foto muito grande.",
            };
        }
        try {
            foto_perfil_url = await uploadAtletaPhotoToR2(
                fotoFile,
                nif,
                nome,
                sobrenome,
            );
        } catch (error) {
            console.error("R2 upload error:", error);
            return {
                errors: {},
                message: "Erro ao fazer upload da foto. Tente novamente.",
            };
        }
    }

    try {
        const usersColumns = await sql<{ column_name: string }[]>`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
        `;

        const hasUsersColumn = (column: string) =>
            usersColumns.some((item) => item.column_name === column);
        const fullName = `${nome} ${sobrenome}`.trim();

        if (hasUsersColumn("name")) {
            await sql`
                UPDATE users
                SET name = ${fullName}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("email")) {
            await sql`
                UPDATE users
                SET email = ${email}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("data_nascimento")) {
            await sql`
                UPDATE users
                SET data_nascimento = ${data_nascimento}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("morada")) {
            await sql`
                UPDATE users
                SET morada = ${morada}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("telefone")) {
            await sql`
                UPDATE users
                SET telefone = ${telemovel}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("peso_kg")) {
            await sql`
                UPDATE users
                SET peso_kg = ${peso_kg}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("altura_cm")) {
            await sql`
                UPDATE users
                SET altura_cm = ${altura_cm}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("nif")) {
            await sql`
                UPDATE users
                SET nif = ${nif}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }

        if (hasUsersColumn("image_url")) {
            await sql`
                UPDATE users
                SET image_url = ${foto_perfil_url}, updated_at = NOW()
                WHERE clerk_user_id = ${userId}
            `;
        }
    } catch (error: any) {
        if (error.code === "23505") {
            return {
                errors: {},
                message: "JÃ¡ existe um perfil com este email ou NIF.",
            };
        }
        console.error("DB update atleta error:", error);
        return {
            errors: {},
            message: "Erro ao guardar perfil. Tente novamente.",
        };
    }

    await logAction(
        userId,
        "atleta_profile_update",
        "/dashboard/utilizador/perfil",
        { email, nif },
    );
    revalidatePath("/dashboard/utilizador/perfil");
    redirect("/dashboard/utilizador/perfil");
}

// ========================================
// Autorizações do Atleta (adulto)
// ========================================

export async function responderConviteEquipaAtleta(
    conviteId: string,
    decisao: "aceitar" | "rejeitar",
): Promise<{ error?: string } | null> {
    const { userId } = await auth();
    if (!userId) return { error: "Não autenticado." };

    const [user] = await sql<{ id: string; organization_id: string | null }[]>`
        SELECT id, organization_id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    if (!user) return { error: "Utilizador não encontrado." };

    const [atleta] = await sql<{ id: string }[]>`
        SELECT id FROM atletas WHERE user_id = ${user.id} LIMIT 1
    `;
    if (!atleta) return { error: "Perfil de atleta não encontrado." };

    const [convite] = await sql<
        {
            id: string;
            equipa_id: string | null;
            treinador_nome: string;
            organization_id: string;
        }[]
    >`
        SELECT id, equipa_id, treinador_nome, organization_id
        FROM convites_equipa
        WHERE id = ${conviteId}
          AND atleta_id = ${atleta.id}
          AND estado = 'pendente'
        LIMIT 1
    `;
    if (!convite) return { error: "Convite não encontrado ou já respondido." };

    const novoEstado = decisao === "aceitar" ? "aceite" : "recusado";

    await sql`
        UPDATE convites_equipa SET estado = ${novoEstado}, updated_at = NOW()
        WHERE id = ${conviteId}
    `;

    if (decisao === "aceitar" && convite.equipa_id) {
        await sql`
            UPDATE atletas SET equipa_id = ${convite.equipa_id}
            WHERE id = ${atleta.id}
        `.catch(() => {});
    }

    revalidatePath("/dashboard/atleta/autorizacoes");
    return null;
}

export async function responderConviteClubeAtleta(
    relacaoId: string,
    decisao: "aceitar" | "rejeitar",
): Promise<{ error?: string } | null> {
    const { userId } = await auth();
    if (!userId) return { error: "Não autenticado." };

    const [user] = await sql<{ id: string }[]>`
        SELECT id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    if (!user) return { error: "Utilizador não encontrado." };

    const [relacao] = await sql<
        {
            id: string;
            alvo_clube_id: string;
            alvo_equipa_id: string | null;
            alvo_nome: string;
        }[]
    >`
        SELECT id, alvo_clube_id::text, alvo_equipa_id::text, alvo_nome
        FROM atleta_relacoes_pendentes
        WHERE id = ${relacaoId}
          AND atleta_user_id = ${user.id}
          AND relation_kind = 'clube'
          AND status = 'pendente'
        LIMIT 1
    `;
    if (!relacao) return { error: "Convite não encontrado ou já respondido." };

    if (decisao === "rejeitar") {
        await sql`
            UPDATE atleta_relacoes_pendentes SET status = 'recusado', updated_at = NOW()
            WHERE id = ${relacaoId}
        `;
    } else {
        await sql`
            UPDATE atleta_relacoes_pendentes SET status = 'aceite', updated_at = NOW()
            WHERE id = ${relacaoId}
        `;

        await sql`
            UPDATE users SET organization_id = ${relacao.alvo_clube_id}, updated_at = NOW()
            WHERE id = ${user.id}
        `.catch(() => {});

        await sql`
            UPDATE atletas
            SET organization_id = ${relacao.alvo_clube_id},
                equipa_id = ${relacao.alvo_equipa_id ?? null},
                estado = 'Ativo',
                updated_at = NOW()
            WHERE user_id = ${user.id}
        `.catch(() => {});
    }

    revalidatePath("/dashboard/atleta/autorizacoes");
    return null;
}
