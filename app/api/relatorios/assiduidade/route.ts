import { gerarRelatorioAssiduidade } from '@/app/lib/actions';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const csv = await gerarRelatorioAssiduidade();
        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="relatorio-assiduidade-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Erro ao gerar relatório' }, { status: 500 });
    }
}
