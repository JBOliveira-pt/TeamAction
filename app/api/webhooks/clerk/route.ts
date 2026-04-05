import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import postgres from "postgres";
import crypto from "node:crypto";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

type AccountType = "presidente" | "treinador" | "atleta" | "responsavel";

function normalizeAccountType(value: unknown): AccountType | null {
    if (typeof value !== "string") return null;

    const normalized = value.toLowerCase();
    if (
        normalized === "presidente" ||
        normalized === "treinador" ||
        normalized === "atleta" ||
        normalized === "responsavel"
    ) {
        return normalized;
    }

    return null;
}

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        return new Response("Webhook secret not found", { status: 500 });
    }

    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response("Error: No Svix headers", { status: 400 });
    }

    const payload = await req.json();
    const body = JSON.stringify(payload);
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: WebhookEvent;

    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error("[WEBHOOK] ❌ Erro na assinatura:", err);
        return new Response("Error verifying webhook", { status: 400 });
    }

    const eventType = evt.type;
    const {
        id,
        email_addresses,
        first_name,
        last_name,
        image_url,
        unsafe_metadata,
        public_metadata,
    } = evt.data as any;

    try {
        if (eventType === "user.created") {
            const email =
                email_addresses?.[0]?.email_address ||
                `pending_${id}@example.com`;
            const name =
                `${first_name || ""} ${last_name || ""}`.trim() || email;
            const accountType = normalizeAccountType(
                unsafe_metadata?.accountType ?? public_metadata?.accountType,
            );
            console.log(
                `[WEBHOOK] Tentando criar usuário: ${email} (id: ${id})`,
            );

            // Usamos uma transação para garantir integridade
            try {
                await sql.begin(async (tx: any) => {
                    // 1. Criar Organização
                    const orgName = `${name}'s Organization`;
                    const slug = `${orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

                    const [org] = await tx`
            INSERT INTO organizations (name, slug, owner_id, created_at, updated_at)
            VALUES (${orgName}, ${slug}, ${id}, NOW(), NOW())
            RETURNING id
          `;

                    console.log(`[WEBHOOK] ✅ Organização criada: ${org.id}`);

                    // 2. Criar Usuário vinculado à Org criada acima
                    const placeholderPassword = `clerk_managed_${crypto.randomUUID()}`;
                    await tx`
            INSERT INTO users (id, name, email, password, clerk_user_id, organization_id, image_url, created_at, updated_at)
                    VALUES (gen_random_uuid(), ${name}, ${email}, ${placeholderPassword}, ${id}, ${org.id}, ${image_url || null}, NOW(), NOW())
          `;

                    console.log(
                        `[WEBHOOK] ✅ Usuário criado com sucesso: ${email}`,
                    );
                });
            } catch (dbError: any) {
                // Se falhar pela falta da tabela organizations, criar usuário com org padrão
                console.warn(
                    `[WEBHOOK] ⚠️ Falha ao criar organização/transação: ${dbError.message}`,
                );
                console.warn(
                    `[WEBHOOK] Criando usuário com organização padrão...`,
                );

                const fallbackPassword = `clerk_managed_${crypto.randomUUID()}`;
                await sql`
          INSERT INTO users (id, name, email, password, clerk_user_id, organization_id, image_url, created_at, updated_at)
                VALUES (gen_random_uuid(), ${name}, ${email}, ${fallbackPassword}, ${id}, '00000000-0000-0000-0000-000000000000', ${image_url || null}, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `;

                console.log(
                    `[WEBHOOK] ✅ Usuário criado com org padrão: ${email}`,
                );
            }

            return new Response("User created successfully", { status: 201 });
        }

        if (eventType === "user.updated") {
            const name = `${first_name || ""} ${last_name || ""}`.trim();
            const accountType = normalizeAccountType(
                unsafe_metadata?.accountType ?? public_metadata?.accountType,
            );

            if (accountType) {
                await sql`
        UPDATE users
        SET name = ${name}, image_url = ${image_url}, updated_at = NOW()
        WHERE clerk_user_id = ${id}
      `;
            } else {
                await sql`
        UPDATE users 
        SET name = ${name}, image_url = ${image_url}, updated_at = NOW() 
        WHERE clerk_user_id = ${id}
      `;
            }
            return new Response("User updated", { status: 200 });
        }

        if (eventType === "user.deleted") {
            // Buscar o user para obter o id UUID e email (id do webhook é clerk_user_id)
            const [user] = await sql<
                { id: string; email: string }[]
            >`SELECT id, email FROM users WHERE clerk_user_id = ${id} LIMIT 1`;

            if (user) {
                await sql.begin(async (tx: any) => {
                    // --- Cascade delete: apagar todos os dados vinculados ---

                    // IDs dos atletas deste user
                    const atletaRows = await tx`
                        SELECT id FROM atletas WHERE user_id = ${user.id}
                    `.catch(() => []);
                    const atletaIds = atletaRows.map(
                        (a: { id: string }) => a.id,
                    );

                    // Dados filhos de atletas
                    if (atletaIds.length > 0) {
                        for (const tbl of [
                            "mensalidades",
                            "estatisticas_jogo",
                            "assiduidade",
                            "eventos_jogo",
                            "avaliacoes_fisicas",
                            "convites_equipa",
                            "recibos",
                        ]) {
                            await tx`
                                DELETE FROM ${tx(tbl)}
                                WHERE atleta_id = ANY(${atletaIds})
                            `.catch(() => {});
                        }
                    }

                    // Dados diretos do user
                    for (const [tbl, col] of [
                        ["atletas", "user_id"],
                        ["staff", "user_id"],
                        ["notificacoes", "recipient_user_id"],
                        ["user_action_logs", "user_id"],
                        ["pedidos_alteracao_perfil", "user_id"],
                        ["pedidos_plano", "user_id"],
                        ["notas_atleta", "user_id"],
                        ["condicao_fisica", "user_id"],
                        ["atleta_relacoes_pendentes", "atleta_user_id"],
                        [
                            "atleta_relacoes_pendentes",
                            "alvo_responsavel_user_id",
                        ],
                        ["atleta_relacoes_pendentes", "alvo_treinador_user_id"],
                        ["exercicios", "treinador_id"],
                        ["sessoes", "treinador_id"],
                        ["avaliacoes_fisicas", "treinador_id"],
                        ["jogadas_taticas", "treinador_id"],
                        ["planos_nutricao", "treinador_id"],
                        ["convites_equipa", "treinador_id"],
                        ["calendar_notes", "user_id"],
                    ] as const) {
                        await tx`
                            DELETE FROM ${tx(tbl)}
                            WHERE ${tx(col)} = ${user.id}
                        `.catch(() => {});
                    }

                    // Recibos criados por este user
                    await tx`
                        DELETE FROM recibos WHERE created_by = ${user.id}
                    `.catch(() => {});

                    // Equipas: limpar treinador (não apagar)
                    await tx`
                        UPDATE equipas SET treinador_id = NULL
                        WHERE treinador_id = ${user.id}
                    `.catch(() => {});

                    // Sessões: limpar criado_por
                    await tx`
                        UPDATE sessoes SET criado_por = NULL
                        WHERE criado_por = ${user.id}
                    `.catch(() => {});

                    // Medico (ligada por email)
                    await tx`
                        DELETE FROM medico WHERE email = ${user.email}
                    `.catch(() => {});

                    // Finalmente, apagar o user
                    await tx`DELETE FROM users WHERE id = ${user.id}`;
                });
            }

            return new Response("User deleted", { status: 200 });
        }

        return new Response("Event received", { status: 200 });
    } catch (error: any) {
        // ESTE LOG É O MAIS IMPORTANTE PARA VOCÊ LER NO TERMINAL AGORA
        console.error("[WEBHOOK] ❌ ERRO NO BANCO DE DADOS:", error.message);
        console.error("[WEBHOOK] Detalhe técnico:", error.detail);
        return new Response(`Error: ${error.message}`, { status: 500 });
    }
}
