// Rota API invite/validate: valida token de convite de responsavel e devolve dados associados.
import { verifyInviteToken } from "@/app/lib/invite-token";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token || typeof token !== "string") {
        return Response.json(
            { valid: false, error: "Token não fornecido." },
            { status: 400 },
        );
    }

    const payload = verifyInviteToken(token);

    if (!payload) {
        return Response.json(
            { valid: false, error: "Convite inválido ou expirado." },
            { status: 400 },
        );
    }

    return Response.json({
        valid: true,
        athleteName: payload.athleteName,
        responsibleEmail: payload.responsibleEmail,
    });
}
