"use server";

import { sql, logAction } from "./_shared";
import { auth } from "@clerk/nextjs/server";
import { getOrganizationId } from "@/app/lib/data";
import { revalidatePath } from "next/cache";

export async function criarEquipa(
    _prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    let organizationId: string;

    try {
        organizationId = await getOrganizationId();
    } catch (error) {
        console.error(
            "Failed to resolve organization for creating team:",
            error,
        );
        return {
            error: "Não foi possível identificar a organização. Tenta novamente.",
        };
    }

    const nome = formData.get("nome") as string;
    const { userId: clerkId } = await auth();
    const escalao = formData.get("escalao") as string;
    const desporto = formData.get("desporto") as string;
    const estado = formData.get("estado") as string;

    // Treinador (real ou fake)
    const treinadorId = formData.get("treinador_id")?.toString().trim() || null;
    const treinadorNomeFake =
        formData.get("treinador_nome_fake")?.toString().trim() || null;

    // Atletas JSON
    const atletasRaw = formData.get("atletas_json")?.toString() || "[]";

    if (!nome?.trim() || !escalao?.trim() || !estado?.trim()) {
        return { error: "Preenche todos os campos obrigatórios." };
    }

    let atletas: {
        nome: string;
        posicao?: string;
        numero_camisola?: string;
    }[] = [];
    try {
        atletas = JSON.parse(atletasRaw);
    } catch {
        return { error: "Dados de atletas inválidos." };
    }

    try {
        const epocas = await sql<{ id: string }[]>`
            SELECT id FROM epocas
            WHERE organization_id = ${organizationId} AND ativa = true
            LIMIT 1
        `;
        const epocaId = epocas[0]?.id ?? null;

        // Validar treinador real se fornecido
        let resolvedTreinadorId: string | null = null;
        if (treinadorId) {
            const [treinador] = await sql<{ id: string }[]>`
                SELECT id FROM users
                WHERE id = ${treinadorId}
                  AND organization_id = ${organizationId}
                  AND account_type = 'treinador'
                LIMIT 1
            `;
            if (!treinador)
                return { error: "Treinador selecionado não encontrado." };
            resolvedTreinadorId = treinador.id;
        }

        // Criar equipa
        const [newEquipa] = await sql<{ id: string }[]>`
            INSERT INTO equipas (nome, escalao, desporto, estado, epoca_id, organization_id, treinador_id, created_at, updated_at)
            VALUES (
                ${nome.trim()}, ${escalao.trim()}, ${desporto.trim()},
                ${estado}, ${epocaId}, ${organizationId}, ${resolvedTreinadorId}, NOW(), NOW()
            )
            RETURNING id
        `;

        // Se treinador fake, criar staff entry
        if (!treinadorId && treinadorNomeFake) {
            await sql`
                INSERT INTO staff (id, organization_id, equipa_id, nome, funcao, created_at, updated_at)
                VALUES (gen_random_uuid(), ${organizationId}, ${newEquipa.id}, ${treinadorNomeFake}, 'Treinador', NOW(), NOW())
            `;
        }

        // Adicionar atletas
        for (const atleta of atletas) {
            if (!atleta.nome?.trim()) continue;
            const numCamisola = atleta.numero_camisola
                ? parseInt(atleta.numero_camisola)
                : null;
            await sql`
                INSERT INTO atletas (id, nome, posicao, numero_camisola, equipa_id, estado, organization_id)
                VALUES (
                    gen_random_uuid(), ${atleta.nome.trim()}, ${atleta.posicao?.trim() || null},
                    ${numCamisola}, ${newEquipa.id}, 'ativo', ${organizationId}
                )
            `;
        }

        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
            VALUES (
                gen_random_uuid(),
                ${organizationId},
                'Nova equipa criada',
                ${`Equipa ${nome.trim()} (${escalao.trim()}) foi criada com sucesso${atletas.length > 0 ? ` com ${atletas.length} atleta(s)` : ""}.`},
                'Info',
                NOW()
            )
        `;

        await logAction(
            clerkId,
            "equipa_create",
            "/dashboard/presidente/equipas",
            {
                nome: nome.trim(),
                escalao: escalao.trim(),
                desporto: desporto.trim(),
                estado,
                treinadorId: resolvedTreinadorId,
                treinadorNomeFake,
                atletasCount: atletas.length,
            },
        );
        revalidatePath("/dashboard/presidente/equipas");
        revalidatePath("/dashboard/presidente/notificacoes");
        return { success: true };
    } catch (error) {
        console.error("Database Error:", error);
        return { error: "Erro ao criar equipa. Tenta novamente." };
    }
}

export async function editarEquipa(
    _prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    let organizationId: string;
    try {
        organizationId = await getOrganizationId();
    } catch {
        return { error: "Não foi possível identificar a organização." };
    }

    const { userId: clerkId } = await auth();
    const id = formData.get("id") as string;
    const nome = formData.get("nome") as string;
    const escalao = formData.get("escalao") as string;
    const estado = formData.get("estado") as string;

    // Treinador
    const treinadorId = formData.get("treinador_id")?.toString().trim() || null;

    // Atletas a remover (JSON array de ids)
    const atletasRemoverRaw =
        formData.get("atletas_remover_json")?.toString() || "[]";
    // Atletas a adicionar (JSON array de objetos)
    const atletasAdicionarRaw =
        formData.get("atletas_adicionar_json")?.toString() || "[]";

    if (!id || !nome?.trim() || !escalao?.trim() || !estado?.trim()) {
        return { error: "Preenche todos os campos obrigatórios." };
    }

    let atletasRemover: string[] = [];
    let atletasAdicionar: {
        nome: string;
        posicao?: string;
        numero_camisola?: string;
    }[] = [];
    try {
        atletasRemover = JSON.parse(atletasRemoverRaw);
        atletasAdicionar = JSON.parse(atletasAdicionarRaw);
    } catch {
        return { error: "Dados de atletas inválidos." };
    }

    try {
        const rows = await sql<{ id: string }[]>`
            SELECT id FROM equipas WHERE id = ${id} AND organization_id = ${organizationId} LIMIT 1
        `;
        if (rows.length === 0) return { error: "Equipa não encontrada." };

        // Validar treinador real se fornecido
        let resolvedTreinadorId: string | null = null;
        if (treinadorId) {
            const [treinador] = await sql<{ id: string }[]>`
                SELECT id FROM users
                WHERE id = ${treinadorId}
                  AND organization_id = ${organizationId}
                  AND account_type = 'treinador'
                LIMIT 1
            `;
            if (!treinador)
                return { error: "Treinador selecionado não encontrado." };
            resolvedTreinadorId = treinador.id;
        }

        // Atualizar equipa (incluindo treinador)
        await sql`
            UPDATE equipas
            SET nome = ${nome.trim()}, escalao = ${escalao.trim()}, estado = ${estado},
                treinador_id = ${resolvedTreinadorId}, updated_at = NOW()
            WHERE id = ${id} AND organization_id = ${organizationId}
        `;

        // Remover atletas
        for (const atletaId of atletasRemover) {
            if (!atletaId) continue;
            await sql`
                DELETE FROM atletas
                WHERE id = ${atletaId} AND equipa_id = ${id} AND organization_id = ${organizationId}
            `;
        }

        // Adicionar novos atletas
        for (const atleta of atletasAdicionar) {
            if (!atleta.nome?.trim()) continue;
            const numCamisola = atleta.numero_camisola
                ? parseInt(atleta.numero_camisola)
                : null;
            await sql`
                INSERT INTO atletas (id, nome, posicao, numero_camisola, equipa_id, estado, organization_id)
                VALUES (
                    gen_random_uuid(), ${atleta.nome.trim()}, ${atleta.posicao?.trim() || null},
                    ${numCamisola}, ${id}, 'ativo', ${organizationId}
                )
            `;
        }

        await logAction(
            clerkId,
            "equipa_update",
            "/dashboard/presidente/equipas",
            {
                equipa_id: id,
                nome: nome.trim(),
                escalao: escalao.trim(),
                estado,
                treinadorId: resolvedTreinadorId,
                atletasRemovidos: atletasRemover.length,
                atletasAdicionados: atletasAdicionar.length,
            },
        );

        revalidatePath("/dashboard/presidente/equipas");
        revalidatePath(`/dashboard/presidente/equipas/${id}`);
        return { success: true };
    } catch (error) {
        console.error("Database Error:", error);
        return { error: "Erro ao editar equipa. Tenta novamente." };
    }
}

export async function eliminarEquipa(
    id: string,
): Promise<{ error?: string; success?: boolean }> {
    let organizationId: string;
    try {
        organizationId = await getOrganizationId();
    } catch {
        return { error: "Não foi possível identificar a organização." };
    }

    const { userId: clerkId } = await auth();

    try {
        const rows = await sql<{ id: string; nome: string }[]>`
            SELECT id, nome FROM equipas WHERE id = ${id} AND organization_id = ${organizationId} LIMIT 1
        `;
        if (rows.length === 0) return { error: "Equipa não encontrada." };

        const nomeEquipa = rows[0].nome;

        // Desassociar atletas da equipa antes de eliminar
        await sql`UPDATE atletas SET equipa_id = NULL WHERE equipa_id = ${id}`;

        await sql`DELETE FROM equipas WHERE id = ${id} AND organization_id = ${organizationId}`;

        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
            VALUES (
                gen_random_uuid(),
                ${organizationId},
                'Equipa eliminada',
                ${`A equipa "${nomeEquipa}" foi eliminada.`},
                'Aviso',
                NOW()
            )
        `;

        await logAction(
            clerkId,
            "equipa_delete",
            "/dashboard/presidente/equipas",
            {
                equipa_id: id,
                nome: nomeEquipa,
            },
        );

        revalidatePath("/dashboard/presidente/equipas");
        revalidatePath("/dashboard/presidente/notificacoes");
        return { success: true };
    } catch (error) {
        console.error("Database Error:", error);
        return { error: "Erro ao eliminar equipa. Tenta novamente." };
    }
}

export async function atribuirTreinadorEquipa(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const equipaId = formData.get("equipa_id")?.toString().trim();
    const treinadorId = formData.get("treinador_id")?.toString().trim() || null;

    if (!equipaId) return { error: "Equipa inválida." };

    try {
        const organizationId = await getOrganizationId();

        if (treinadorId) {
            const [treinador] = await sql<{ id: string }[]>`
                SELECT id FROM users
                WHERE id = ${treinadorId}
                  AND organization_id = ${organizationId}
                  AND account_type = 'treinador'
                LIMIT 1
            `;
            if (!treinador) return { error: "Treinador não encontrado." };
        }

        await sql`
            UPDATE equipas
            SET treinador_id = ${treinadorId}, updated_at = NOW()
            WHERE id = ${equipaId} AND organization_id = ${organizationId}
        `;
    } catch (error) {
        console.error(error);
        return { error: "Erro ao atribuir treinador." };
    }

    revalidatePath("/dashboard/presidente/equipas");
    return { success: true };
}
