import { NextRequest, NextResponse } from "next/server";
import {
    getAdminSessionFromCookie,
    isAdminSessionTokenValid,
} from "@/app/lib/admin-auth";
import { createInviteToken } from "@/app/lib/invite-token";

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
                Para concluir o seu registo como <strong>Responsável</strong> (vinculado a este atleta),
                clique no botão abaixo:
              </p>
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
    const token = await getAdminSessionFromCookie();
    if (!isAdminSessionTokenValid(token)) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { athleteUserId, athleteName, responsibleEmail } = body as {
        athleteUserId?: string;
        athleteName?: string;
        responsibleEmail?: string;
    };

    if (!athleteUserId || !athleteName || !responsibleEmail) {
        return NextResponse.json(
            { error: "Campos obrigatórios em falta" },
            { status: 400 },
        );
    }

    try {
        const { token: inviteToken, code } = createInviteToken(
            athleteUserId,
            athleteName,
            responsibleEmail,
        );

        const baseUrl = getBaseUrl();
        const inviteUrl = `${baseUrl}/signup?invite=${encodeURIComponent(inviteToken)}`;

        const subject = `${athleteName} precisa de si como Responsável na TeamAction`;
        const bodyText = [
            `Olá,`,
            ``,
            `O atleta ${athleteName} indicou o seu e-mail como Responsável na plataforma TeamAction.`,
            ``,
            `Para concluir o seu registo como Responsável (vinculado a este atleta), clique no link abaixo:`,
            ``,
            inviteUrl,
            ``,
            `Este convite expira em 72 horas.`,
            `Se não reconhece este pedido, pode ignorar este e-mail com segurança.`,
            ``,
            `— TeamAction`,
        ].join("\n");

        return NextResponse.json({
            success: true,
            code,
            mailto: {
                to: responsibleEmail,
                subject,
                body: bodyText,
            },
        });
    } catch (err) {
        console.error("[ADMIN_INVITE] Failed to generate invite:", err);
        return NextResponse.json(
            {
                error:
                    err instanceof Error
                        ? err.message
                        : "Erro ao gerar convite",
            },
            { status: 500 },
        );
    }
}
