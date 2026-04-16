// Queries de comunicados, autorizações e documentos da organização.
import {
    sql,
    getOrganizationId,
    maybeCreateMinorAthleteTemporaryProfileNotice,
    maybeCreateResponsavelWelcomeNotice,
} from "./_shared";
import { auth } from "@clerk/nextjs/server";
import { ensureRecipientUserIdColumn } from "../notification-schema";

// ---------- COMUNICADOS ----------

export async function fetchComunicados() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                id: string;
                titulo: string;
                conteudo: string;
                destinatarios: string;
                criado_por: string;
                created_at: string;
            }[]
        >`
            SELECT id, titulo, conteudo, destinatarios, criado_por, created_at
            FROM comunicados
            WHERE organization_id = ${organizationId}
            ORDER BY created_at DESC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch comunicados.");
    }
}

// ---------- AUTORIZAÃ‡Ã•ES ----------

export async function fetchAutorizacoes() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                id: string;
                solicitante_nome: string | null;
                solicitante_tipo: string | null;
                tipo_acao: string;
                notas: string | null;
                status: string;
                created_at: string;
                resolved_at: string | null;
            }[]
        >`
            SELECT al.id, al.tipo_acao, al.notas, al.status, al.created_at, al.resolved_at,
                   u.name         AS solicitante_nome,
                   u.account_type AS solicitante_tipo
            FROM autorizacoes_log al
            LEFT JOIN users u ON u.id = al.autorizado_a
            WHERE al.organization_id = ${organizationId}
            ORDER BY
                CASE WHEN al.status = 'pendente' THEN 0 ELSE 1 END,
                al.created_at DESC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch autorizacoes.");
    }
}

// ---------- DOCUMENTOS ----------

export async function fetchDocumentos() {
    try {
        const organizationId = await getOrganizationId();

        const data = await sql<
            {
                id: string;
                nome: string;
                tipo: string;
                url_r2: string;
                created_at: string;
            }[]
        >`
            SELECT id, nome, tipo, url_r2, created_at
            FROM documentos
            WHERE organization_id = ${organizationId}
            ORDER BY created_at DESC
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch documentos.");
    }
}

export async function fetchNotificacoes() {
    try {
        let organizationId: string | null = null;
        try {
            organizationId = await getOrganizationId({
                allowAutoProvision: false,
            });
        } catch {
            // Trainer sem organização própria — continuar apenas com recipient_user_id
        }

        const { userId, sessionId } = await auth();

        if (!userId) {
            return [];
        }

        await ensureRecipientUserIdColumn(sql);

        const currentDbUser = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
        `;

        const dbUserId = currentDbUser[0]?.id;

        if (!dbUserId) {
            return [];
        }

        if (sessionId && organizationId) {
            try {
                await maybeCreateMinorAthleteTemporaryProfileNotice({
                    organizationId,
                    clerkUserId: userId,
                    dbUserId,
                    sessionId,
                });
            } catch (error) {
                console.error(
                    "Failed to create temporary-profile notice for minor athlete:",
                    error,
                );
            }

            try {
                await maybeCreateResponsavelWelcomeNotice({
                    organizationId,
                    dbUserId,
                });
            } catch (error) {
                console.error(
                    "Failed to create welcome notice for responsável:",
                    error,
                );
            }
        }

        const data = await sql<
            {
                id: string;
                titulo: string;
                descricao: string;
                tipo: string;
                lida: boolean;
                created_at: string;
            }[]
        >`
            SELECT id, titulo, descricao, tipo, lida, created_at
            FROM notificacoes
            WHERE (
                ${
                    organizationId
                        ? sql`(organization_id = ${organizationId} AND recipient_user_id IS NULL) OR`
                        : sql``
                }
                recipient_user_id = ${dbUserId}
            )
            ORDER BY created_at DESC
            LIMIT 50
        `;

        return data;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Failed to fetch notificacoes.");
    }
}
