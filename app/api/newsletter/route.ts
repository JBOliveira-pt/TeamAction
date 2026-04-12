import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const nome = typeof body.nome === "string" ? body.nome.trim() : "";
        const email =
            typeof body.email === "string"
                ? body.email.trim().toLowerCase()
                : "";

        if (!nome || !email) {
            return NextResponse.json(
                { error: "Nome e e-mail são obrigatórios." },
                { status: 400 },
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Formato de e-mail inválido." },
                { status: 400 },
            );
        }

        const existing = await sql`
            SELECT id FROM newsletter_subscribers WHERE email = ${email}
        `;

        if (existing.length > 0) {
            return NextResponse.json(
                { error: "Este e-mail já está inscrito na newsletter." },
                { status: 409 },
            );
        }

        await sql`
            INSERT INTO newsletter_subscribers (nome, email)
            VALUES (${nome}, ${email})
        `;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[NEWSLETTER_SUBSCRIBE]", error);
        return NextResponse.json(
            { error: "Erro interno ao processar inscrição." },
            { status: 500 },
        );
    }
}
