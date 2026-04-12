// Rota API relatorios/mensalidades: gera relatorio de mensalidades dos atletas.
import { NextResponse } from "next/server";
import { sql, getOrganizationId } from "@/app/lib/data/_shared";

export async function GET() {
    try {
        const organizationId = await getOrganizationId();

        const agora = new Date();
        const mes = agora.getMonth() + 1;
        const ano = agora.getFullYear();

        const rows = await sql<{
            atleta_nome: string;
            equipa_nome: string | null;
            mes: number;
            ano: number;
            valor: number | null;
            estado: string;
            data_pagamento: string | null;
        }[]>`
            SELECT
                atletas.nome        AS atleta_nome,
                equipas.nome        AS equipa_nome,
                mensalidades.mes,
                mensalidades.ano,
                mensalidades.valor,
                mensalidades.estado,
                mensalidades.data_pagamento
            FROM mensalidades
            JOIN atletas  ON mensalidades.atleta_id = atletas.id
            LEFT JOIN equipas ON atletas.equipa_id  = equipas.id
            WHERE mensalidades.organization_id = ${organizationId}
              AND mensalidades.mes = ${mes}
              AND mensalidades.ano = ${ano}
            ORDER BY atletas.nome ASC
        `;

        if (rows.length === 0) {
            return new NextResponse(
                "Sem dados de mensalidades para o mês atual.",
                { status: 404 },
            );
        }

        const header = ["Atleta", "Equipa", "Mês", "Ano", "Valor (€)", "Estado", "Data Pagamento"];
        const linhas = rows.map((r) => [
            `"${r.atleta_nome}"`,
            `"${r.equipa_nome ?? "—"}"`,
            String(r.mes),
            String(r.ano),
            r.valor != null ? String(r.valor) : "—",
            r.estado,
            r.data_pagamento
                ? new Date(r.data_pagamento).toLocaleDateString("pt-PT")
                : "—",
        ]);

        const csv = [header, ...linhas]
            .map((row) => row.join(";"))
            .join("\n");

        const nomesFicheiro = `mensalidades-${String(mes).padStart(2, "0")}-${ano}.csv`;
        const csvBuffer = Buffer.from("\uFEFF" + csv, "utf-8");
        return new NextResponse(csvBuffer, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8-sig",
                "Content-Disposition": `attachment; filename="${nomesFicheiro}"`,
            },
        });
    } catch (error) {
        console.error("Erro ao gerar relatório de mensalidades:", error);
        return new NextResponse("Erro interno ao gerar relatório.", {
            status: 500,
        });
    }
}