// Actions de comunicados, autorizações, federação e documentos.
"use server";

import { sql, logAction } from "./_shared";
import { auth } from "@clerk/nextjs/server";
import { uploadImageToR2 } from "../r2-storage";
import { getOrganizationId } from "@/app/lib/data";
import { revalidatePath } from "next/cache";

type ComunicadoState = { error?: string; success?: boolean } | null;

export async function criarComunicado(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const organizationId = await getOrganizationId();

    const titulo = formData.get("titulo") as string;
    const conteudo = formData.get("conteudo") as string;
    const destinatarios = formData.get("destinatarios") as string;

    if (!titulo?.trim() || !conteudo?.trim() || !destinatarios?.trim()) {
        return { error: "Preenche todos os campos obrigatÃ³rios." };
    }

    try {
        const { userId: clerkId } = await auth();

        const userResult = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkId}
        `;
        const dbUserId = userResult[0]?.id ?? null;

        await sql`
            INSERT INTO comunicados (titulo, conteudo, destinatarios, criado_por, organization_id, created_at)
            VALUES (${titulo.trim()}, ${conteudo.trim()}, ${destinatarios.trim()}, ${dbUserId}, ${organizationId}, NOW())
        `;

        // NotificaÃ§Ã£o automÃ¡tica
        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
            VALUES (
                gen_random_uuid(),
                ${organizationId},
                'Novo comunicado publicado',
                ${`"${titulo.trim()}" foi enviado para: ${destinatarios.trim()}.`},
                'Info',
                NOW()
            )
        `;

        await logAction(
            clerkId,
            "comunicado_create",
            "/dashboard/presidente/comunicados",
            { titulo: titulo.trim(), destinatarios: destinatarios.trim() },
        );
        revalidatePath("/dashboard/presidente/comunicados");
        revalidatePath("/dashboard/presidente/notificacoes");
        return { success: true };
    } catch (error) {
        console.error("Database Error:", error);
        return { error: "Erro ao enviar comunicado. Tenta novamente." };
    }
}
// ---------- EDITAR COMUNICADO ----------

export async function editarComunicado(
    comunicadoId: string,
    dados: { titulo: string; conteudo: string; destinatarios: string },
): Promise<{ error?: string; success?: boolean }> {
    if (
        !comunicadoId ||
        !dados.titulo?.trim() ||
        !dados.conteudo?.trim() ||
        !dados.destinatarios?.trim()
    ) {
        return { error: "Preenche todos os campos obrigatórios." };
    }

    try {
        const organizationId = await getOrganizationId();
        const { userId: clerkId } = await auth();

        const existing = await sql<{ id: string }[]>`
            SELECT id FROM comunicados
            WHERE id = ${comunicadoId} AND organization_id = ${organizationId}
        `;
        if (existing.length === 0) {
            return { error: "Comunicado não encontrado." };
        }

        await sql`
            UPDATE comunicados
            SET titulo = ${dados.titulo.trim()},
                conteudo = ${dados.conteudo.trim()},
                destinatarios = ${dados.destinatarios.trim()}
            WHERE id = ${comunicadoId}
              AND organization_id = ${organizationId}
        `;

        // Notificação de reenvio
        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
            VALUES (
                gen_random_uuid(),
                ${organizationId},
                'Comunicado atualizado',
                ${`"${dados.titulo.trim()}" foi atualizado e reenviado para: ${dados.destinatarios.trim()}.`},
                'Info',
                NOW()
            )
        `;

        await logAction(
            clerkId,
            "comunicado_edit",
            "/dashboard/presidente/comunicados",
            {
                comunicado_id: comunicadoId,
                titulo: dados.titulo.trim(),
                destinatarios: dados.destinatarios.trim(),
            },
        );
        revalidatePath("/dashboard/presidente/comunicados");
        revalidatePath("/dashboard/presidente/notificacoes");
        revalidatePath("/dashboard/responsavel/comunicados");
        return { success: true };
    } catch (error) {
        console.error("Database Error:", error);
        return { error: "Erro ao editar comunicado." };
    }
}

// ---------- EXCLUIR COMUNICADO ----------

export async function excluirComunicado(
    comunicadoId: string,
): Promise<{ error?: string; success?: boolean }> {
    if (!comunicadoId) {
        return { error: "ID do comunicado em falta." };
    }

    try {
        const organizationId = await getOrganizationId();
        const { userId: clerkId } = await auth();

        const existing = await sql<{ id: string; titulo: string }[]>`
            SELECT id, titulo FROM comunicados
            WHERE id = ${comunicadoId} AND organization_id = ${organizationId}
        `;
        if (existing.length === 0) {
            return { error: "Comunicado não encontrado." };
        }

        await sql`
            DELETE FROM comunicados
            WHERE id = ${comunicadoId}
              AND organization_id = ${organizationId}
        `;

        await logAction(
            clerkId,
            "comunicado_delete",
            "/dashboard/presidente/comunicados",
            { comunicado_id: comunicadoId, titulo: existing[0].titulo },
        );
        revalidatePath("/dashboard/presidente/comunicados");
        revalidatePath("/dashboard/responsavel/comunicados");
        return { success: true };
    } catch (error) {
        console.error("Database Error:", error);
        return { error: "Erro ao excluir comunicado." };
    }
}
// ---------- AUTORIZAÃ‡Ã•ES ----------

export async function registarAutorizacao(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const organizationId = await getOrganizationId();

    const autorizadoA = formData.get("autorizado_a") as string;
    const tipoAcao = formData.get("tipo_acao") as string;
    const notas = formData.get("notas") as string | null;

    if (!autorizadoA?.trim() || !tipoAcao?.trim()) {
        return { error: "Preenche todos os campos obrigatÃ³rios." };
    }

    try {
        const { userId: clerkId } = await auth();

        // CORREÃ‡ÃƒO: buscar UUID real da base de dados
        const userResult = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkId}
        `;
        const dbUserId = userResult[0]?.id ?? null;

        await sql`
            INSERT INTO autorizacoes_log (autorizado_a, autorizado_por, tipo_acao, notas, organization_id, created_at)
            VALUES (${autorizadoA.trim()}, ${dbUserId}, ${tipoAcao.trim()}, ${notas?.trim() ?? null}, ${organizationId}, NOW())
        `;

        await logAction(
            clerkId,
            "autorizacao_create",
            "/dashboard/presidente/autorizacoes",
            { autorizado_a: autorizadoA.trim(), tipo_acao: tipoAcao.trim() },
        );
        revalidatePath("/dashboard/presidente/autorizacoes");
        return { success: true };
    } catch (error) {
        console.error("Database Error:", error);
        return { error: "Erro ao registar autorização." };
    }
}

// ---------- RESOLVER PEDIDO DE FEDERAÇÃO ----------

export async function resolverPedidoFederacao(
    pedidoId: string,
    decisao: "aprovado" | "recusado",
): Promise<{ error?: string; success?: boolean }> {
    try {
        const organizationId = await getOrganizationId();
        const { userId: clerkId } = await auth();

        const userResult = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkId}
        `;
        const dbUserId = userResult[0]?.id ?? null;

        if (!dbUserId) {
            return { error: "Utilizador não encontrado." };
        }

        // Verificar se o pedido pertence à organização e está pendente
        const pedido = await sql<{ id: string }[]>`
            SELECT id FROM autorizacoes_log
            WHERE id = ${pedidoId}
              AND organization_id = ${organizationId}
              AND status = 'pendente'
        `;

        if (pedido.length === 0) {
            return { error: "Pedido não encontrado ou já resolvido." };
        }

        await sql`
            UPDATE autorizacoes_log
            SET status = ${decisao},
                resolved_at = NOW(),
                resolved_by = ${dbUserId}
            WHERE id = ${pedidoId}
              AND organization_id = ${organizationId}
        `;

        await logAction(
            clerkId,
            `autorizacao_${decisao}`,
            "/dashboard/presidente/autorizacoes",
            { pedido_id: pedidoId, decisao },
        );
        revalidatePath("/dashboard/presidente/autorizacoes");
        return { success: true };
    } catch (error) {
        console.error("Database Error:", error);
        return { error: "Erro ao resolver pedido." };
    }
}

// ---------- EDITAR PEDIDO DE FEDERAÇÃO ----------

export async function editarPedidoFederacao(
    pedidoId: string,
    novaDecisao: "aprovado" | "recusado" | "pendente",
): Promise<{ error?: string; success?: boolean }> {
    try {
        const organizationId = await getOrganizationId();
        const { userId: clerkId } = await auth();

        const userResult = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkId}
        `;
        const dbUserId = userResult[0]?.id ?? null;

        if (!dbUserId) {
            return { error: "Utilizador não encontrado." };
        }

        const pedido = await sql<{ id: string }[]>`
            SELECT id FROM autorizacoes_log
            WHERE id = ${pedidoId}
              AND organization_id = ${organizationId}
        `;

        if (pedido.length === 0) {
            return { error: "Pedido não encontrado." };
        }

        if (novaDecisao === "pendente") {
            await sql`
                UPDATE autorizacoes_log
                SET status = 'pendente',
                    resolved_at = NULL,
                    resolved_by = NULL
                WHERE id = ${pedidoId}
                  AND organization_id = ${organizationId}
            `;
        } else {
            await sql`
                UPDATE autorizacoes_log
                SET status = ${novaDecisao},
                    resolved_at = NOW(),
                    resolved_by = ${dbUserId}
                WHERE id = ${pedidoId}
                  AND organization_id = ${organizationId}
            `;
        }

        await logAction(
            clerkId,
            `autorizacao_editada`,
            "/dashboard/presidente/autorizacoes",
            { pedido_id: pedidoId, nova_decisao: novaDecisao },
        );
        revalidatePath("/dashboard/presidente/autorizacoes");
        return { success: true };
    } catch (error) {
        console.error("Database Error:", error);
        return { error: "Erro ao editar pedido." };
    }
}

// ---------- ELIMINAR PEDIDO DE FEDERAÇÃO ----------

export async function eliminarPedidoFederacao(
    pedidoId: string,
): Promise<{ error?: string; success?: boolean }> {
    try {
        const organizationId = await getOrganizationId();
        const { userId: clerkId } = await auth();

        const userResult = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkId}
        `;
        const dbUserId = userResult[0]?.id ?? null;

        if (!dbUserId) {
            return { error: "Utilizador não encontrado." };
        }

        const pedido = await sql<
            { id: string; autorizado_a: string; tipo_acao: string }[]
        >`
            SELECT id, autorizado_a, tipo_acao FROM autorizacoes_log
            WHERE id = ${pedidoId}
              AND organization_id = ${organizationId}
        `;

        if (pedido.length === 0) {
            return { error: "Pedido não encontrado." };
        }

        await sql`
            DELETE FROM autorizacoes_log
            WHERE id = ${pedidoId}
              AND organization_id = ${organizationId}
        `;

        await logAction(
            clerkId,
            "autorizacao_eliminada",
            "/dashboard/presidente/autorizacoes",
            {
                pedido_id: pedidoId,
                autorizado_a: pedido[0].autorizado_a,
                tipo_acao: pedido[0].tipo_acao,
            },
        );
        revalidatePath("/dashboard/presidente/autorizacoes");
        return { success: true };
    } catch (error) {
        console.error("Database Error:", error);
        return { error: "Erro ao eliminar pedido." };
    }
}

// ---------- DOCUMENTOS ----------

export async function uploadDocumento(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const organizationId = await getOrganizationId();

    const file = formData.get("ficheiro") as File | null;
    const nome = formData.get("nome") as string;

    if (!file || file.size === 0) return { error: "Seleciona um ficheiro." };
    if (!nome?.trim()) return { error: "Indica um nome para o documento." };

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE)
        return { error: "Ficheiro demasiado grande. MÃ¡ximo 10MB." };

    const extensao = file.name.split(".").pop()?.toUpperCase() ?? "PDF";
    const tiposPermitidos = ["PDF", "XLSX", "DOCX"];
    if (!tiposPermitidos.includes(extensao)) {
        return {
            error: "Tipo de ficheiro nÃ£o permitido. Usa PDF, XLSX ou DOCX.",
        };
    }

    try {
        const { userId: clerkId } = await auth();

        // CORREÃ‡ÃƒO: buscar o UUID real da base de dados
        const userResult = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkId}
        `;
        const dbUserId = userResult[0]?.id ?? null;

        const url = await uploadImageToR2(file, "user", crypto.randomUUID());

        await sql`
            INSERT INTO documentos (nome, tipo, url_r2, uploaded_by, organization_id, created_at)
            VALUES (${nome.trim()}, ${extensao}, ${url}, ${dbUserId}, ${organizationId}, NOW())
        `;

        revalidatePath("/dashboard/presidente/documentos");
        return { success: true };
    } catch (error) {
        console.error("Database Error:", error);
        return { error: "Erro ao carregar documento. Tenta novamente." };
    }
}
