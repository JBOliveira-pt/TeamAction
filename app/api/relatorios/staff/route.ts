// Rota API relatorios/staff: gera e devolve relatorio CSV de staff.
import { gerarRelatorioStaff } from "@/app/lib/actions";
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

        const csv = await gerarRelatorioStaff();
        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="relatorio-staff-${new Date().toISOString().split("T")[0]}.csv"`,
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
