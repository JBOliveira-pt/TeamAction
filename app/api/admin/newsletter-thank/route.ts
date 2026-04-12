import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";
import { Resend } from "resend";
import { ASSETS } from "@/app/lib/assets";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

function getResend(): Resend {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not set");
    return new Resend(apiKey);
}

function buildThankYouHtml(subscriberName: string): string {
    return `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1e3a5f;padding:24px 32px;text-align:center;">
              <img
                src="${ASSETS.logoFullWhite}"
                alt="TeamAction"
                width="180"
                style="display:inline-block;max-width:180px;height:auto;"
              />
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;color:#1e3a5f;font-size:20px;">
                Obrigado pela sua inscrição, ${subscriberName}!
              </h2>
              <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
                Agradecemos o seu interesse em receber as novidades da <strong>TeamAction</strong>.
                A partir de agora, ficará a par de todas as atualizações, funcionalidades e melhorias
                da nossa plataforma de gestão desportiva.
              </p>
              <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
                A nossa missão é simplificar o dia a dia de clubes, treinadores, atletas e responsáveis.
                Estamos entusiasmados por tê-lo(a) connosco nesta jornada!
              </p>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                Se tiver alguma questão ou sugestão, não hesite em responder diretamente a este e-mail.
              </p>
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://teamaction.vercel.app"}" target="_blank"
                       style="display:inline-block;background:#1e3a5f;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:8px;">
                      Visitar TeamAction
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">
                Equipa TeamAction
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                &copy; ${new Date().getFullYear()} TeamAction &mdash; Plataforma de Gestão Desportiva
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const subscriberId = body.subscriberId;

        if (!subscriberId) {
            return NextResponse.json(
                { error: "subscriberId é obrigatório." },
                { status: 400 },
            );
        }

        const rows = await sql`
            SELECT id, nome, email, thanked_at
            FROM newsletter_subscribers
            WHERE id = ${subscriberId}
        `;

        if (rows.length === 0) {
            return NextResponse.json(
                { error: "Inscrição não encontrada." },
                { status: 404 },
            );
        }

        const subscriber = rows[0];

        if (subscriber.thanked_at) {
            return NextResponse.json(
                { error: "E-mail de agradecimento já foi enviado." },
                { status: 409 },
            );
        }

        const fromAddress =
            process.env.RESEND_FROM_EMAIL ||
            "TeamAction <onboarding@resend.dev>";

        const resend = getResend();
        const { error } = await resend.emails.send({
            from: fromAddress,
            replyTo: process.env.RESEND_REPLY_TO_EMAIL || undefined,
            to: subscriber.email,
            subject: "Obrigado por se inscrever na Newsletter TeamAction!",
            html: buildThankYouHtml(subscriber.nome),
        });

        if (error) {
            console.error("[NEWSLETTER_THANK] Resend error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await sql`
            UPDATE newsletter_subscribers
            SET thanked_at = NOW()
            WHERE id = ${subscriberId}
        `;

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[NEWSLETTER_THANK] Failed:", err);
        return NextResponse.json(
            { error: "Erro interno ao enviar e-mail." },
            { status: 500 },
        );
    }
}
