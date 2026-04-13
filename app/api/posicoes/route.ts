import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

export async function GET() {
    const posicoes = await sql<{ nome: string }[]>`
        SELECT nome FROM posicoes ORDER BY ordem ASC
    `;
    return Response.json(posicoes.map((p) => p.nome));
}
