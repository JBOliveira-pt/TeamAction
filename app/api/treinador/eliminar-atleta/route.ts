import { eliminarAtletaFicicioTreinador } from "@/app/lib/actions";

export async function POST(req: Request) {
    const body = await req.json();
    if (!body.atleta_id) {
        return new Response("ID do atleta em falta.", { status: 400 });
    }
    const result = await eliminarAtletaFicicioTreinador(body.atleta_id);
    if (result.error) {
        return new Response(result.error, { status: 400 });
    }
    return Response.json({ ok: true });
}
