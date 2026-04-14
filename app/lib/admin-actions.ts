// Actions do admin: CRUD utilizadores, aprovar pedidos, gerir planos e equipas.
"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import postgres, { type JSONValue } from "postgres";
import { clerkClient } from "@clerk/nextjs/server";
import { ASSETS } from "@/app/lib/assets";
import {
    clearAdminSessionCookie,
    createAdminSessionToken,
    requireAdminSession,
    setAdminSessionCookie,
} from "@/app/lib/admin-auth";
import { ensureAdminTables } from "@/app/lib/admin-data";
import { ensureRecipientUserIdColumn } from "@/app/lib/notification-schema";

const sql = postgres(process.env.POSTGRES_URL!, {
    ssl: "require",
    onnotice: () => {},
});

function getAdminPasswordHash(): string {
    const hash = process.env.ADMIN_LOGIN_PASSWORD_HASH;
    if (!hash) {
        throw new Error(
            "Missing ADMIN_LOGIN_PASSWORD_HASH environment variable.",
        );
    }
    return hash;
}

function isClerkNotFoundError(error: unknown): boolean {
    if (!error || typeof error !== "object") {
        return false;
    }

    const maybeStatus = (error as { status?: unknown }).status;
    return typeof maybeStatus === "number" && maybeStatus === 404;
}

const ADMIN_DELETE_CONFIRM_TEXT = "deletarconta";

type SqlExecutor = typeof sql;

async function tableExists(
    tx: SqlExecutor,
    tableName: string,
): Promise<boolean> {
    const data = await tx<{ exists: boolean }[]>`
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = ${tableName}
        ) AS exists
    `;

    return Boolean(data[0]?.exists);
}

async function columnExists(
    tx: SqlExecutor,
    tableName: string,
    columnName: string,
): Promise<boolean> {
    const data = await tx<{ exists: boolean }[]>`
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = ${tableName}
              AND column_name = ${columnName}
        ) AS exists
    `;

    return Boolean(data[0]?.exists);
}

async function deleteByColumnIfExists(
    tx: SqlExecutor,
    tableName: string,
    columnName: string,
    userId: string,
): Promise<void> {
    const [hasTable, hasColumn] = await Promise.all([
        tableExists(tx, tableName),
        columnExists(tx, tableName, columnName),
    ]);

    if (!hasTable || !hasColumn) {
        return;
    }

    await tx`
        DELETE FROM ${tx(tableName)}
        WHERE ${tx(columnName)} = ${userId}
    `;
}

async function deleteRecibosByUser(
    tx: SqlExecutor,
    userId: string,
): Promise<void> {
    const hasRecibos = await tableExists(tx, "recibos");
    if (!hasRecibos) {
        return;
    }

    const hasCreatedBy = await columnExists(tx, "recibos", "created_by");
    if (hasCreatedBy) {
        await tx`
            DELETE FROM recibos
            WHERE created_by = ${userId}
        `;
    }
}

/**
 * Apaga em cascata todos os dados vinculados a um utilizador.
 * Deve correr dentro de uma transação.
 *
 * Ordem: tabelas-filha primeiro, depois tabelas-pai, por fim users.
 */
export async function cascadeDeleteUser(
    tx: SqlExecutor,
    userId: string,
    userEmail?: string | null,
): Promise<void> {
    // 0) Obter organization_id do user antes de apagar
    const userRows = await tx<
        { organization_id: string | null }[]
    >`SELECT organization_id FROM users WHERE id = ${userId} LIMIT 1`;
    const userOrgId = userRows[0]?.organization_id ?? null;

    // 1) Obter IDs dos atletas vinculados a este user
    const atletaIds = (await tableExists(tx, "atletas"))
        ? (
              await tx<{ id: string }[]>`
            SELECT id FROM atletas WHERE user_id = ${userId}
        `
          ).map((a) => a.id)
        : [];

    // 2) Dados filhos de atletas (atleta_id → atletas.id)
    if (atletaIds.length > 0) {
        await deleteByTableColumnIn(
            tx,
            "convocatorias",
            "atleta_id",
            atletaIds,
        );
        await deleteByTableColumnIn(tx, "mensalidades", "atleta_id", atletaIds);
        await deleteByTableColumnIn(
            tx,
            "estatisticas_jogo",
            "atleta_id",
            atletaIds,
        );
        await deleteByTableColumnIn(tx, "assiduidade", "atleta_id", atletaIds);
        await deleteByTableColumnIn(tx, "eventos_jogo", "atleta_id", atletaIds);
        await deleteByTableColumnIn(
            tx,
            "avaliacoes_fisicas",
            "atleta_id",
            atletaIds,
        );
        await deleteByTableColumnIn(
            tx,
            "convites_equipa",
            "atleta_id",
            atletaIds,
        );
        // recibos vinculados ao atleta
        await deleteByTableColumnIn(tx, "recibos", "atleta_id", atletaIds);
    }

    // 3) Dados directamente ligados ao user_id
    await deleteByColumnIfExists(tx, "atletas", "user_id", userId);
    await deleteByColumnIfExists(tx, "staff", "user_id", userId);
    await deleteByColumnIfExists(
        tx,
        "notificacoes",
        "recipient_user_id",
        userId,
    );
    // Manter user_action_logs — logs são histórico e não devem ser apagados com o user
    await nullifyColumnIfExists(tx, "user_action_logs", "user_id", userId);
    await deleteByColumnIfExists(
        tx,
        "pedidos_alteracao_perfil",
        "user_id",
        userId,
    );
    await deleteByColumnIfExists(tx, "pedidos_plano", "user_id", userId);
    await deleteByColumnIfExists(tx, "notas_atleta", "user_id", userId);
    await deleteByColumnIfExists(tx, "condicao_fisica", "user_id", userId);
    await deleteByColumnIfExists(tx, "user_cursos", "user_id", userId);
    await deleteRecibosByUser(tx, userId);

    // 3b) Convites de clube (enviados ou recebidos)
    await deleteByColumnIfExists(
        tx,
        "convites_clube",
        "convidado_user_id",
        userId,
    );
    await deleteByColumnIfExists(tx, "convites_clube", "convidado_por", userId);

    // 3c) Conteúdo criado pelo user (comunicados e documentos)
    await deleteByColumnIfExists(tx, "comunicados", "criado_por", userId);
    await deleteByColumnIfExists(tx, "documentos", "uploaded_by", userId);

    // 4) Relações pendentes (atleta ou responsável)
    await deleteByColumnIfExists(
        tx,
        "atleta_relacoes_pendentes",
        "atleta_user_id",
        userId,
    );
    await deleteByColumnIfExists(
        tx,
        "atleta_relacoes_pendentes",
        "alvo_responsavel_user_id",
        userId,
    );
    await deleteByColumnIfExists(
        tx,
        "atleta_relacoes_pendentes",
        "alvo_treinador_user_id",
        userId,
    );

    // 5) Dados criados por treinador (treinador_id → users.id)
    await deleteByColumnIfExists(tx, "exercicios", "treinador_id", userId);
    await deleteByColumnIfExists(tx, "sessoes", "treinador_id", userId);
    await deleteByColumnIfExists(
        tx,
        "avaliacoes_fisicas",
        "treinador_id",
        userId,
    );
    await deleteByColumnIfExists(tx, "jogadas_taticas", "treinador_id", userId);
    await deleteByColumnIfExists(tx, "planos_nutricao", "treinador_id", userId);
    await deleteByColumnIfExists(tx, "convites_equipa", "treinador_id", userId);
    await deleteByColumnIfExists(tx, "calendar_notes", "user_id", userId);

    // 6) Equipas: limpar treinador_id (equipa é partilhada, não se apaga)
    await nullifyColumnIfExists(tx, "equipas", "treinador_id", userId);

    // 7) Dados partilhados: nullificar referências do user (preservar os registos)
    await nullifyColumnIfExists(tx, "sessoes", "criado_por", userId);
    await nullifyColumnIfExists(tx, "mensalidades", "updated_by", userId);
    await nullifyColumnIfExists(tx, "recibos", "sent_by_user", userId);
    await nullifyColumnIfExists(tx, "estatisticas_jogo", "created_by", userId);

    // 7b) Logs de autorizações: preservar histórico, nullificar referências
    await nullifyColumnIfExists(
        tx,
        "autorizacoes_log",
        "autorizado_por",
        userId,
    );
    await nullifyColumnIfExists(tx, "autorizacoes_log", "autorizado_a", userId);
    await nullifyColumnIfExists(tx, "autorizacoes_log", "resolved_by", userId);

    // 8) Tabela medico (ligada por email)
    if (userEmail && (await tableExists(tx, "medico"))) {
        await tx`DELETE FROM medico WHERE email = ${userEmail}`;
    }

    // 9) Finalmente, apagar o registo do user
    await tx`DELETE FROM users WHERE id = ${userId}`;

    // 10) Organização: se o user era o único membro, apagar a org e dados org-scoped
    if (userOrgId) {
        const remainingUsers = await tx<{ count: string }[]>`
            SELECT COUNT(*)::text AS count FROM users
            WHERE organization_id = ${userOrgId}
        `;
        const remaining = Number(remainingUsers[0]?.count ?? 0);

        if (remaining === 0) {
            // Nenhum outro user nesta org — apagar tudo que é org-scoped
            await deleteByOrgIfExists(tx, "notificacoes", userOrgId);
            await deleteByOrgIfExists(tx, "comunicados", userOrgId);
            await deleteByOrgIfExists(tx, "documentos", userOrgId);
            await deleteByOrgIfExists(tx, "epocas", userOrgId);
            await deleteByOrgIfExists(tx, "clubes", userOrgId);
            await deleteByOrgIfExists(tx, "pedidos_plano", userOrgId);

            if (await tableExists(tx, "organizations")) {
                await tx`DELETE FROM organizations WHERE id = ${userOrgId}`;
            }
        }
    }
}

/** Apagar linhas de uma tabela onde organization_id = orgId */
async function deleteByOrgIfExists(
    tx: SqlExecutor,
    tableName: string,
    orgId: string,
): Promise<void> {
    const hasT = await tableExists(tx, tableName);
    if (!hasT) return;
    const hasC = await columnExists(tx, tableName, "organization_id");
    if (!hasC) return;
    await tx`
        DELETE FROM ${tx(tableName)}
        WHERE organization_id = ${orgId}
    `;
}

/** Apagar linhas de uma tabela onde a coluna está num array de IDs */
async function deleteByTableColumnIn(
    tx: SqlExecutor,
    tableName: string,
    columnName: string,
    ids: string[],
): Promise<void> {
    if (ids.length === 0) return;
    const hasT = await tableExists(tx, tableName);
    if (!hasT) return;
    const hasC = await columnExists(tx, tableName, columnName);
    if (!hasC) return;
    await tx`
        DELETE FROM ${tx(tableName)}
        WHERE ${tx(columnName)} = ANY(${ids})
    `;
}

/** SET column = NULL onde column = userId */
async function nullifyColumnIfExists(
    tx: SqlExecutor,
    tableName: string,
    columnName: string,
    userId: string,
): Promise<void> {
    const hasT = await tableExists(tx, tableName);
    if (!hasT) return;
    const hasC = await columnExists(tx, tableName, columnName);
    if (!hasC) return;
    await tx`
        UPDATE ${tx(tableName)}
        SET ${tx(columnName)} = NULL
        WHERE ${tx(columnName)} = ${userId}
    `;
}

export async function adminLoginAction(formData: FormData): Promise<void> {
    const password = String(formData.get("password") || "").trim();

    if (!password) {
        redirect("/admin-login?error=1");
    }

    let isValid = false;
    try {
        isValid = await bcrypt.compare(password, getAdminPasswordHash());
    } catch {
        redirect("/admin-login?error=config");
    }

    if (!isValid) {
        redirect("/admin-login?error=1");
    }

    const token = createAdminSessionToken();
    await setAdminSessionCookie(token);
    redirect("/admin");
}

export async function adminLogoutAction(): Promise<void> {
    await clearAdminSessionCookie();
    redirect("/admin-login");
}

export async function adminUpdateUserAction(
    userId: string,
    formData: FormData,
): Promise<void | { error: string }> {
    await requireAdminSession();

    const section = String(formData.get("_section") || "").trim() || null;

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const organizationName = String(
        formData.get("organizationName") || "",
    ).trim();
    const profilePhoto = formData.get("profilePhoto");
    const iban = String(formData.get("iban") || "").trim() || null;
    const dataNascimento =
        String(formData.get("dataNascimento") || "").trim() || null;
    const telefone = String(formData.get("telefone") || "").trim() || null;
    const rawPassword = String(formData.get("password") || "").trim();

    // Campos pessoais adicionais
    const sobrenome = String(formData.get("sobrenome") || "").trim() || null;
    const morada = String(formData.get("morada") || "").trim() || null;
    const pesoKg = String(formData.get("pesoKg") || "").trim() || null;
    const alturaCm = String(formData.get("alturaCm") || "").trim() || null;
    const nif = String(formData.get("nif") || "").trim() || null;
    const codigoPostal =
        String(formData.get("codigoPostal") || "").trim() || null;
    const cidade = String(formData.get("cidade") || "").trim() || null;
    const pais = String(formData.get("pais") || "").trim() || null;

    // Campos específicos do atleta
    const atletaId = String(formData.get("atletaId") || "").trim() || null;
    const posicao = String(formData.get("posicao") || "").trim() || null;
    const numeroCamisola =
        String(formData.get("numeroCamisola") || "").trim() || null;
    const equipaId = String(formData.get("equipaId") || "").trim() || null;
    const estadoAtleta =
        String(formData.get("estadoAtleta") || "").trim() || null;
    const maoDominante =
        String(formData.get("maoDominante") || "").trim() || null;
    const federado = formData.get("federado") === "on";
    const numeroFederado =
        String(formData.get("numeroFederado") || "").trim() || null;

    // Campos específicos do staff
    const staffId = String(formData.get("staffId") || "").trim() || null;
    const funcaoStaff =
        String(formData.get("funcaoStaff") || "").trim() || null;
    const equipaIdStaff =
        String(formData.get("equipaIdStaff") || "").trim() || null;

    if (!section && (!name || !email)) {
        redirect(`/admin/users/${userId}?error=required`);
    }
    if (section === "pessoais" && (!name || !email)) {
        redirect(`/admin/users/${userId}?error=required`);
    }

    let emailChanged = false;

    try {
        const userData = await sql<
            {
                clerk_user_id: string | null;
                email: string;
                organization_id: string | null;
            }[]
        >`
            SELECT clerk_user_id, email, organization_id
            FROM users
            WHERE id = ${userId}
            LIMIT 1
        `;

        const currentUser = userData[0];
        if (!currentUser) {
            redirect(`/admin/users/${userId}?error=update`);
        }

        const clerkUserId = currentUser.clerk_user_id;

        // Helper: verificar se a secção dada deve ser executada
        const inSection = (s: string) => !section || section === s;

        // --- Upload de foto via R2 ---
        let imageUrl: string | null = null;
        if (
            inSection("pessoais") &&
            profilePhoto instanceof File &&
            profilePhoto.size > 0
        ) {
            const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
            const ALLOWED_PHOTO_TYPES = [
                "image/jpeg",
                "image/png",
                "image/webp",
            ];
            if (
                !ALLOWED_PHOTO_TYPES.includes(profilePhoto.type) ||
                profilePhoto.size > MAX_PHOTO_SIZE
            ) {
                redirect(`/admin/users/${userId}?error=update`);
            }
            const { uploadImageToR2 } = await import("@/app/lib/r2-storage");
            imageUrl = await uploadImageToR2(profilePhoto, "user", userId);
        }

        // --- Atualizações no Clerk (nome, email, password) ---
        if (clerkUserId) {
            const client = await clerkClient();

            if (inSection("pessoais")) {
                // Separar nome/apelido para o Clerk
                const nameParts = name.split(/\s+/);
                const firstName = nameParts[0] || name;
                const lastName =
                    nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

                await client.users.updateUser(clerkUserId, {
                    firstName,
                    lastName,
                });

                // Tratar alteração de email via Clerk
                const previousEmail = currentUser.email.toLowerCase();
                const newEmail = email.toLowerCase();
                if (newEmail !== previousEmail) {
                    emailChanged = true;
                    await client.emailAddresses.createEmailAddress({
                        userId: clerkUserId,
                        emailAddress: email,
                    });
                }
            }

            // Tratar alteração de password via Clerk
            if (inSection("seguranca") && rawPassword.length > 0) {
                await client.users.updateUser(clerkUserId, {
                    password: rawPassword,
                });
            }
        }

        // --- Base de dados: atualizar tabela users ---
        const hashedPassword =
            inSection("seguranca") && rawPassword.length > 0
                ? await bcrypt.hash(rawPassword, 12)
                : null;

        // Descobrir colunas opcionais
        const optionalCols = await sql<{ column_name: string }[]>`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'users'
              AND column_name IN (
                  'data_nascimento', 'telefone',
                  'sobrenome', 'morada', 'peso_kg', 'altura_cm',
                  'nif', 'codigo_postal', 'cidade', 'pais'
              )
        `;
        const hasCol = (col: string) =>
            optionalCols.some((c) => c.column_name === col);

        // Campos principais (name, email, password, image) — para pessoais/seguranca/full
        if (inSection("pessoais")) {
            if (imageUrl) {
                await sql`
                    UPDATE users
                    SET name = ${name}, email = ${email}, image_url = ${imageUrl},
                        updated_at = NOW()
                    WHERE id = ${userId}
                `;
            } else {
                await sql`
                    UPDATE users
                    SET name = ${name}, email = ${email},
                        updated_at = NOW()
                    WHERE id = ${userId}
                `;
            }
        }
        if (hashedPassword) {
            await sql`
                UPDATE users
                SET password = ${hashedPassword}, updated_at = NOW()
                WHERE id = ${userId}
            `;
        }

        // Atualizar colunas opcionais individualmente (por secção)
        if (inSection("morada") && iban !== null) {
            await sql`
                UPDATE clubes SET iban = ${iban}, updated_at = NOW()
                WHERE presidente_user_id = ${userId}
            `;
        }
        if (
            inSection("pessoais") &&
            hasCol("data_nascimento") &&
            dataNascimento
        ) {
            await sql`
                UPDATE users SET data_nascimento = ${dataNascimento}, updated_at = NOW()
                WHERE id = ${userId}
            `;
        }
        if (inSection("morada") && hasCol("telefone")) {
            await sql`
                UPDATE users SET telefone = ${telefone}, updated_at = NOW()
                WHERE id = ${userId}
            `;
        }
        if (inSection("pessoais") && hasCol("sobrenome")) {
            await sql`
                UPDATE users SET sobrenome = ${sobrenome}, updated_at = NOW()
                WHERE id = ${userId}
            `;
        }
        if (inSection("morada") && hasCol("morada")) {
            await sql`
                UPDATE users SET morada = ${morada}, updated_at = NOW()
                WHERE id = ${userId}
            `;
        }
        if (inSection("desportivos") && pesoKg !== null) {
            await sql`
                UPDATE atletas SET peso_kg = ${Number(pesoKg)}, updated_at = NOW()
                WHERE user_id = ${userId}
            `;
        }
        if (inSection("desportivos") && alturaCm !== null) {
            await sql`
                UPDATE atletas SET altura_cm = ${Number(alturaCm)}, updated_at = NOW()
                WHERE user_id = ${userId}
            `;
        }
        if (inSection("morada") && hasCol("nif")) {
            await sql`
                UPDATE users SET nif = ${nif}, updated_at = NOW()
                WHERE id = ${userId}
            `;
        }
        if (inSection("morada") && hasCol("codigo_postal")) {
            await sql`
                UPDATE users SET codigo_postal = ${codigoPostal}, updated_at = NOW()
                WHERE id = ${userId}
            `;
        }
        if (inSection("morada") && hasCol("cidade")) {
            await sql`
                UPDATE users SET cidade = ${cidade}, updated_at = NOW()
                WHERE id = ${userId}
            `;
        }
        if (inSection("morada") && hasCol("pais")) {
            await sql`
                UPDATE users SET pais = ${pais}, updated_at = NOW()
                WHERE id = ${userId}
            `;
        }

        // --- Base de dados: atualizar tabela atletas ---
        if (inSection("desportivos") && atletaId) {
            const hasAtletas = await tableExists(sql, "atletas");
            if (hasAtletas) {
                // Validar clube antes de permitir federado=true
                let safeFederado = federado;
                if (federado && currentUser.organization_id) {
                    const clubeRows = await sql`
                        SELECT id FROM clubes WHERE organization_id = ${currentUser.organization_id} LIMIT 1
                    `;
                    if (clubeRows.length === 0) safeFederado = false;
                } else if (federado && !currentUser.organization_id) {
                    safeFederado = false;
                }

                // Validar unicidade do nº federado dentro da organização
                if (
                    safeFederado &&
                    numeroFederado &&
                    currentUser.organization_id
                ) {
                    const duplicado = await sql<{ id: string }[]>`
                        SELECT id FROM atletas
                        WHERE organization_id = ${currentUser.organization_id}
                          AND numero_federado = ${numeroFederado}
                          AND id != ${atletaId}
                        LIMIT 1
                    `;
                    if (duplicado.length > 0) {
                        return {
                            error: `Já existe um atleta com o nº federado ${numeroFederado} neste clube.`,
                        };
                    }
                }

                await sql`
                    UPDATE atletas
                    SET posicao = ${posicao},
                        numero_camisola = ${numeroCamisola ? Number(numeroCamisola) : null},
                        equipa_id = ${equipaId || null},
                        estado = ${estadoAtleta || "ativo"},
                        federado = ${safeFederado},
                        numero_federado = ${safeFederado ? numeroFederado : null},
                        mao_dominante = ${maoDominante}
                    WHERE id = ${atletaId}
                `;
            }
        }

        // --- Base de dados: atualizar tabela staff ---
        if (inSection("staff") && staffId) {
            const hasStaff = await tableExists(sql, "staff");
            if (hasStaff) {
                await sql`
                    UPDATE staff
                    SET funcao = ${funcaoStaff},
                        equipa_id = ${equipaIdStaff || null}
                    WHERE id = ${staffId}
                `;
            }
        }

        // --- Base de dados: atualizar nome da organização ---
        if (
            inSection("seguranca") &&
            organizationName &&
            currentUser.organization_id
        ) {
            await sql`
                UPDATE organizations
                SET name = ${organizationName}, updated_at = NOW()
                WHERE id = ${currentUser.organization_id}
            `;
            // Manter clubes.nome sincronizado
            await sql`
                UPDATE clubes
                SET nome = ${organizationName}, updated_at = NOW()
                WHERE organization_id = ${currentUser.organization_id}
            `;
        }

        // --- Log de auditoria ---
        await ensureAdminTables();
        const updateMetadata: JSONValue = JSON.parse(
            JSON.stringify({
                section: section || "all",
                name,
                email,
                organizationName: organizationName || null,
                imageUrl: imageUrl || null,
                photoUploaded: imageUrl !== null,
                iban,
                dataNascimento,
                telefone,
                sobrenome,
                morada,
                pesoKg,
                alturaCm,
                nif,
                codigoPostal,
                cidade,
                pais,
                atletaId,
                staffId,
                passwordChanged: rawPassword.length > 0,
                emailChanged,
            }),
        );
        await sql`
            INSERT INTO user_action_logs (user_id, user_name, user_email, interaction_type, path, metadata, affected_user_name, affected_user_email)
            VALUES (
                ${userId},
                ${"Administrador"},
                ${"admin@teamaction.local"},
                ${"admin_user_update"},
                ${`/admin/users/${userId}`},
                ${sql.json(updateMetadata)},
                ${name},
                ${email}
            )
        `;
    } catch (error) {
        console.error(error);
        redirect(`/admin/users/${userId}?error=update`);
    }

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    redirect(
        `/admin/users/${userId}?success=${emailChanged ? "email_pending" : "1"}`,
    );
}

export async function adminDeleteUserAction(
    userId: string,
    formData: FormData,
): Promise<void> {
    await requireAdminSession();

    const confirmation = String(
        formData.get("deleteConfirmation") || "",
    ).trim();
    if (confirmation !== ADMIN_DELETE_CONFIRM_TEXT) {
        redirect(`/admin/users/${userId}?error=delete_confirmation`);
    }

    let targetUser:
        | {
              id: string;
              name: string;
              email: string;
              clerk_user_id: string | null;
          }
        | undefined;

    try {
        const rows = await sql<
            {
                id: string;
                name: string;
                email: string;
                clerk_user_id: string | null;
            }[]
        >`
            SELECT id, name, email, clerk_user_id
            FROM users
            WHERE id = ${userId}
            LIMIT 1
        `;

        targetUser = rows[0];
    } catch (error) {
        console.error(error);
        redirect(`/admin/users/${userId}?error=delete`);
    }

    if (!targetUser) {
        redirect("/admin/users?error=user_not_found");
    }

    try {
        await sql.begin(async (tx) => {
            const executor = tx as unknown as SqlExecutor;
            await cascadeDeleteUser(executor, userId, targetUser.email);
        });
    } catch (error) {
        console.error(error);
        redirect(`/admin/users/${userId}?error=delete`);
    }

    let clerkDeletionWarning = false;

    if (targetUser.clerk_user_id) {
        try {
            const client = await clerkClient();
            await client.users.deleteUser(targetUser.clerk_user_id);
        } catch (error) {
            if (isClerkNotFoundError(error)) {
                console.info(
                    "Utilizador ja nao existia no Clerk durante exclusao:",
                    targetUser.clerk_user_id,
                );
            } else {
                console.error("Falha ao remover utilizador no Clerk:", error);
                clerkDeletionWarning = true;
            }
        }
    }

    try {
        await ensureAdminTables();
        const deleteMetadata: JSONValue = JSON.parse(
            JSON.stringify({
                deletedUserId: targetUser.id,
                deletedUserEmail: targetUser.email,
                deletedUserName: targetUser.name,
            }),
        );
        await sql`
            INSERT INTO user_action_logs (user_id, user_name, user_email, interaction_type, path, metadata, affected_user_name, affected_user_email)
            VALUES (
                NULL,
                ${"Administrador"},
                ${"admin@teamaction.local"},
                ${"admin_user_delete"},
                ${`/admin/users/${userId}`},
                ${sql.json(deleteMetadata)},
                ${targetUser.name},
                ${targetUser.email}
            )
        `;
    } catch (error) {
        console.error(
            "Falha ao registar log de exclusao de utilizador:",
            error,
        );
    }

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);

    if (clerkDeletionWarning) {
        redirect("/admin/users?success=deleted&warning=clerk");
    }

    redirect("/admin/users?success=deleted");
}

export async function adminCreateAvisoAction(
    formData: FormData,
): Promise<void> {
    await requireAdminSession();

    await ensureRecipientUserIdColumn(sql);

    const titulo = String(formData.get("titulo") || "").trim();
    const descricao = String(formData.get("descricao") || "").trim();
    const scope = String(formData.get("scope") || "all");
    const userId = String(formData.get("userId") || "").trim();

    if (!titulo || !descricao) {
        redirect("/admin/avisos?error=required");
    }

    try {
        if (scope === "user") {
            if (!userId) {
                redirect("/admin/avisos?error=user");
            }

            const targetUser = await sql<
                { organization_id: string | null }[]
            >`SELECT organization_id FROM users WHERE id = ${userId} LIMIT 1`;

            const targetOrgId = targetUser[0]?.organization_id;
            if (!targetOrgId) {
                redirect("/admin/avisos?error=org");
            }

            await sql`
                INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                VALUES (gen_random_uuid(), ${targetOrgId}, ${userId}, ${titulo}, ${descricao}, 'Aviso', false, NOW())
            `;
        } else {
            const organizations = await sql<{ id: string }[]>`
                SELECT id FROM organizations
            `;

            if (organizations.length === 0) {
                redirect("/admin/avisos?error=no_org");
            }

            await Promise.all(
                organizations.map(
                    (org) =>
                        sql`
                        INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
                        VALUES (gen_random_uuid(), ${org.id}, NULL, ${titulo}, ${descricao}, 'Aviso', false, NOW())
                    `,
                ),
            );
        }

        await ensureAdminTables();
        const warningMetadata: JSONValue = JSON.parse(
            JSON.stringify({ titulo, scope, userId: userId || null }),
        );
        await sql`
            INSERT INTO user_action_logs (user_id, user_name, user_email, interaction_type, path, metadata)
            VALUES (
                NULL,
                ${"Administrador"},
                ${"admin@teamaction.local"},
                ${"admin_warning_emit"},
                ${"/admin/avisos"},
                ${sql.json(warningMetadata)}
            )
        `;
    } catch (error) {
        console.error(error);
        redirect("/admin/avisos?error=emit");
    }

    revalidatePath("/dashboard");
    revalidatePath("/admin/avisos");
    redirect("/admin/avisos?success=1");
}

// Aprovar / Rejeitar Pedidos de Plano

export async function adminResolvePedidoPlanoAction(
    formData: FormData,
): Promise<void> {
    await requireAdminSession();

    const pedidoId = String(formData.get("pedidoId") || "").trim();
    const decisao = String(formData.get("decisao") || "").trim();

    if (!pedidoId || (decisao !== "aprovado" && decisao !== "rejeitado")) {
        redirect("/admin/planos?error=invalid");
    }

    try {
        const pedido = await sql<
            {
                id: string;
                user_id: string;
                organization_id: string;
                plano_solicitado: string;
                status: string;
            }[]
        >`
            SELECT id, user_id, organization_id, plano_solicitado, status
            FROM pedidos_plano
            WHERE id = ${pedidoId}
            LIMIT 1
        `;

        if (!pedido.length || pedido[0].status !== "pendente") {
            redirect("/admin/planos?error=not_found");
        }

        const { user_id, organization_id, plano_solicitado } = pedido[0];

        await sql`
            UPDATE pedidos_plano
            SET status = ${decisao}, updated_at = NOW()
            WHERE id = ${pedidoId}
        `;

        if (decisao === "aprovado") {
            await sql`
                UPDATE organizations
                SET plano = ${plano_solicitado}, updated_at = NOW()
                WHERE id = ${organization_id}
            `;
        }

        // Notificar o utilizador
        const planoLabel: Record<string, string> = {
            team: "Team",
            club_pro: "Club Pro",
            legend: "Legend",
        };
        const label = planoLabel[plano_solicitado] || plano_solicitado;
        const titulo =
            decisao === "aprovado" ? "Plano Aprovado" : "Plano Rejeitado";
        const descricao =
            decisao === "aprovado"
                ? `O seu pedido para o plano ${label} foi aprovado. O plano já está ativo.`
                : `O seu pedido para o plano ${label} foi rejeitado pelo administrador.`;

        await ensureRecipientUserIdColumn(sql);
        await sql`
            INSERT INTO notificacoes (id, organization_id, recipient_user_id, titulo, descricao, tipo, lida, created_at)
            VALUES (gen_random_uuid(), ${organization_id}, ${user_id}, ${titulo}, ${descricao}, 'Aviso', false, NOW())
        `;

        // Log de auditoria
        await ensureAdminTables();
        const metadata: JSONValue = JSON.parse(
            JSON.stringify({
                pedidoId,
                decisao,
                plano_solicitado,
                organization_id,
                user_id,
            }),
        );
        await sql`
            INSERT INTO user_action_logs (user_id, user_name, user_email, interaction_type, path, metadata)
            VALUES (
                NULL,
                ${"Administrador"},
                ${"admin@teamaction.local"},
                ${`admin_plan_${decisao}`},
                ${"/admin/planos"},
                ${sql.json(metadata)}
            )
        `;
    } catch (error) {
        console.error(error);
        redirect("/admin/planos?error=action");
    }

    revalidatePath("/admin/planos");
    revalidatePath("/dashboard");
    redirect(`/admin/planos?success=${decisao}`);
}

// Admin: Editar Clube

export async function adminUpdateClubeAction(
    organizationId: string,
    formData: FormData,
): Promise<void> {
    await requireAdminSession();

    const nome = String(formData.get("nome") || "").trim();
    const modalidade = String(formData.get("modalidade") || "").trim() || null;
    const nipc = String(formData.get("nipc") || "").trim() || null;
    const website = String(formData.get("website") || "").trim() || null;
    const telefone = String(formData.get("telefone") || "").trim() || null;
    const morada = String(formData.get("morada") || "").trim() || null;
    const codigoPostal =
        String(formData.get("codigo_postal") || "").trim() || null;
    const cidade = String(formData.get("cidade") || "").trim() || null;
    const pais = String(formData.get("pais") || "").trim() || null;

    // Descobrir o user_id para redirect (presidente desta org)
    const ownerRows = await sql<{ id: string }[]>`
        SELECT id FROM users
        WHERE organization_id = ${organizationId} AND account_type = 'presidente'
        LIMIT 1
    `;
    const userId = ownerRows[0]?.id;

    if (!nome) {
        if (userId) redirect(`/admin/users/${userId}?error=required`);
        redirect("/admin/users?error=required");
    }

    if (nipc && !/^\d{9}$/.test(nipc)) {
        if (userId) redirect(`/admin/users/${userId}?error=update`);
        redirect("/admin/users?error=update");
    }

    try {
        await sql`
            UPDATE organizations
            SET name = ${nome}, updated_at = NOW()
            WHERE id = ${organizationId}
        `;

        await sql`
            UPDATE clubes
            SET
                nome          = ${nome},
                modalidade    = ${modalidade},
                nipc          = ${nipc},
                website       = ${website},
                telefone      = ${telefone},
                morada        = ${morada},
                codigo_postal = ${codigoPostal},
                cidade        = ${cidade},
                pais          = ${pais},
                updated_at    = NOW()
            WHERE organization_id = ${organizationId}
        `;

        await ensureAdminTables();
        const metadata: JSONValue = JSON.parse(
            JSON.stringify({
                organizationId,
                nome,
                modalidade,
                nipc,
            }),
        );
        await sql`
            INSERT INTO user_action_logs (user_id, user_name, user_email, interaction_type, path, metadata)
            VALUES (
                NULL,
                ${"Administrador"},
                ${"admin@teamaction.local"},
                ${"admin_clube_update"},
                ${`/admin/users/${userId ?? "unknown"}`},
                ${sql.json(metadata)}
            )
        `;
    } catch (error) {
        console.error(error);
        if (userId) redirect(`/admin/users/${userId}?error=update`);
        redirect("/admin/users?error=update");
    }

    revalidatePath("/admin/users");
    if (userId) {
        revalidatePath(`/admin/users/${userId}`);
        redirect(`/admin/users/${userId}?success=1`);
    }
    redirect("/admin/users?success=1");
}

// Admin: Editar Equipa

export async function adminEditEquipaAction(
    equipaId: string,
    formData: FormData,
): Promise<void> {
    await requireAdminSession();

    const nome = String(formData.get("nome") || "").trim();
    const escalao = String(formData.get("escalao") || "").trim() || null;
    const estado = String(formData.get("estado") || "").trim() || null;
    const redirectUserId =
        String(formData.get("_redirectUserId") || "").trim() || null;

    if (!nome) {
        if (redirectUserId)
            redirect(`/admin/users/${redirectUserId}?error=required`);
        redirect("/admin/users?error=required");
    }

    try {
        await sql`
            UPDATE equipas
            SET nome = ${nome}, escalao = ${escalao}, estado = ${estado}, updated_at = NOW()
            WHERE id = ${equipaId}
        `;

        await ensureAdminTables();
        const metadata: JSONValue = JSON.parse(
            JSON.stringify({ equipaId, nome, escalao, estado }),
        );
        await sql`
            INSERT INTO user_action_logs (user_id, user_name, user_email, interaction_type, path, metadata)
            VALUES (
                NULL,
                ${"Administrador"},
                ${"admin@teamaction.local"},
                ${"admin_equipa_update"},
                ${`/admin/users/${redirectUserId ?? "unknown"}`},
                ${sql.json(metadata)}
            )
        `;
    } catch (error) {
        console.error(error);
        if (redirectUserId)
            redirect(`/admin/users/${redirectUserId}?error=update`);
        redirect("/admin/users?error=update");
    }

    revalidatePath("/admin/users");
    if (redirectUserId) {
        revalidatePath(`/admin/users/${redirectUserId}`);
        redirect(`/admin/users/${redirectUserId}?success=1`);
    }
    redirect("/admin/users?success=1");
}

// Admin: Eliminar Equipa

export async function adminDeleteEquipaAction(
    equipaId: string,
    formData: FormData,
): Promise<void> {
    await requireAdminSession();

    const redirectUserId =
        String(formData.get("_redirectUserId") || "").trim() || null;

    try {
        const rows = await sql<{ id: string; nome: string }[]>`
            SELECT id, nome FROM equipas WHERE id = ${equipaId} LIMIT 1
        `;
        if (rows.length === 0) {
            if (redirectUserId)
                redirect(`/admin/users/${redirectUserId}?error=update`);
            redirect("/admin/users?error=update");
        }

        const nomeEquipa = rows[0].nome;

        // Desvincular atletas da equipa
        await sql`UPDATE atletas SET equipa_id = NULL WHERE equipa_id = ${equipaId}`;

        // Desvincular staff da equipa
        await sql`UPDATE staff SET equipa_id = NULL WHERE equipa_id = ${equipaId}`;

        // Desvincular treinador_id da equipa noutras referências
        await sql`DELETE FROM equipas WHERE id = ${equipaId}`;

        await ensureAdminTables();
        const metadata: JSONValue = JSON.parse(
            JSON.stringify({ equipaId, nome: nomeEquipa }),
        );
        await sql`
            INSERT INTO user_action_logs (user_id, user_name, user_email, interaction_type, path, metadata)
            VALUES (
                NULL,
                ${"Administrador"},
                ${"admin@teamaction.local"},
                ${"admin_equipa_delete"},
                ${`/admin/users/${redirectUserId ?? "unknown"}`},
                ${sql.json(metadata)}
            )
        `;
    } catch (error) {
        console.error(error);
        if (redirectUserId)
            redirect(`/admin/users/${redirectUserId}?error=update`);
        redirect("/admin/users?error=update");
    }

    revalidatePath("/admin/users");
    if (redirectUserId) {
        revalidatePath(`/admin/users/${redirectUserId}`);
        redirect(`/admin/users/${redirectUserId}?success=1`);
    }
    redirect("/admin/users?success=1");
}
