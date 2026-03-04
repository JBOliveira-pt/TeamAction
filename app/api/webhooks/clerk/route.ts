import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

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
  const { id, email_addresses, first_name, last_name, image_url } = evt.data as any;

  try {
    if (eventType === "user.created") {
      const email = email_addresses?.[0]?.email_address || `pending_${id}@example.com`;
      const name = `${first_name || ""} ${last_name || ""}`.trim() || email;

      console.log(`[WEBHOOK] Tentando criar usuário: ${email}`);

      // Usamos uma transação para garantir integridade
      await sql.begin(async (tx: any) => {
        
        // 1. Criar Organização
        const orgName = `${name}'s Organization`;
        const slug = `${orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

        const [org] = await tx`
          INSERT INTO organizations (name, slug, owner_id, created_at, updated_at)
          VALUES (${orgName}, ${slug}, ${id}, NOW(), NOW())
          RETURNING id
        `;

        console.log(`[WEBHOOK] Organização criada: ${org.id}`);

        // 2. Criar Usuário vinculado à Org criada acima
        await tx`
          INSERT INTO users (id, name, email, clerk_user_id, role, organization_id, image_url, created_at, updated_at)
          VALUES (gen_random_uuid(), ${name}, ${email}, ${id}, 'admin', ${org.id}, ${image_url || null}, NOW(), NOW())
        `;
      });

      console.log(`[WEBHOOK] ✅ Sincronização concluída para ${email}`);
      return new Response("User and Org created", { status: 201 });
    }

    if (eventType === "user.updated") {
      const name = `${first_name || ""} ${last_name || ""}`.trim();
      await sql`
        UPDATE users 
        SET name = ${name}, image_url = ${image_url}, updated_at = NOW() 
        WHERE clerk_user_id = ${id}
      `;
      return new Response("User updated", { status: 200 });
    }

    if (eventType === "user.deleted") {
      await sql`DELETE FROM users WHERE clerk_user_id = ${id}`;
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