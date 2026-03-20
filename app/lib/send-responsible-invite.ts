import { Resend } from "resend";
import { createInviteToken } from "./invite-token";

function getResend(): Resend {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        throw new Error("RESEND_API_KEY is not set");
    }
    return new Resend(apiKey);
}

function getBaseUrl(): string {
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
    }
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    return "http://localhost:3000";
}

function buildEmailHtml(athleteName: string, inviteUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header with logo -->
          <tr>
            <td style="background:#1e3a5f;padding:24px 32px;text-align:center;">
              <img
                src="https://pub-5de44bde848c4dbcabd75025afe46c7e.r2.dev/teamaction-images/teamaction-logofull-white.png"
                alt="TeamAction"
                width="180"
                style="display:inline-block;max-width:180px;height:auto;"
              />
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px;color:#1e3a5f;font-size:18px;">
                Convite para ser Responsável
              </h2>
              <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
                O atleta <strong>${athleteName}</strong> indicou o seu e-mail como Responsável na plataforma
                <strong>TeamAction</strong>.
              </p>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                Para concluir o seu perfil como <strong>Responsável</strong> (vinculado a este atleta),
                clique no botão abaixo:
              </p>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" target="_blank"
                       style="display:inline-block;background:#1e3a5f;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:8px;">
                      Criar minha conta de Responsável
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.5;">
                Este convite expira em <strong>72 horas</strong>.
              </p>
              <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">
                Se não reconhece este pedido, pode ignorar este e-mail com segurança.
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

export async function sendResponsibleInviteEmail(
    athleteUserId: string,
    athleteName: string,
    responsibleEmail: string,
): Promise<{ success: boolean; code: string; error?: string }> {
    try {
        const { token, code } = createInviteToken(
            athleteUserId,
            athleteName,
            responsibleEmail,
        );

        const baseUrl = getBaseUrl();
        const inviteUrl = `${baseUrl}/signup?invite=${encodeURIComponent(token)}`;

        const fromAddress =
            process.env.RESEND_FROM_EMAIL ||
            "TeamAction <onboarding@resend.dev>";

        const resend = getResend();
        const { error } = await resend.emails.send({
            from: fromAddress,
            replyTo: process.env.RESEND_REPLY_TO_EMAIL || undefined,
            to: responsibleEmail,
            subject: `${athleteName} precisa de si como Responsável na TeamAction`,
            html: buildEmailHtml(athleteName, inviteUrl),
        });

        if (error) {
            console.error("[INVITE_EMAIL] Resend error:", error);
            return { success: false, code, error: error.message };
        }

        return { success: true, code };
    } catch (err) {
        console.error("[INVITE_EMAIL] Failed to send invite:", err);
        return {
            success: false,
            code: "",
            error: err instanceof Error ? err.message : "Unknown error",
        };
    }
}
