// Rota API relatorios/assiduidade: gera e devolve relatorio CSV de assiduidade.
import { gerarRelatorioAssiduidade } from "@/app/lib/actions";
import { requireApiAccountType } from "@/app/lib/api-guards";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const access = await requireApiAccountType();
        if (!access.ok) {
            return NextResponse.json(
                { error: access.error },
                { status: access.status },
            );
        }

        const csv = await gerarRelatorioAssiduidade();
        const csvBuffer = Buffer.from("\uFEFF" + csv, "utf-8");
        return new NextResponse(csvBuffer, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8-sig",
                "Content-Disposition": `attachment; filename="relatorio-assiduidade-${new Date().toISOString().split("T")[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Erro ao gerar relatório" },
            { status: 500 },
        );
    }
}
