"use server";

import { sql } from "./_shared";
import { auth } from "@clerk/nextjs/server";

export type AutorizacaoTreinador = {
    id: string;
    tipo: "convite_clube";
    titulo: string;
    descricao: string;
    created_at: string;
};

export async function fetchAutorizacoesTreinador(): Promise<
    AutorizacaoTreinador[]
> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return [];

    const [user] = await sql<{ id: string }[]>`
        SELECT id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;
    if (!user) return [];

    const rows = await sql<
        {
            id: string;
            clube_nome: string;
            equipa_nome: string;
            convidado_por_nome: string;
            created_at: string;
        }[]
    >`
        SELECT
            cc.id,
            c.nome AS clube_nome,
            e.nome AS equipa_nome,
            sender.name AS convidado_por_nome,
            cc.created_at::text
        FROM convites_clube cc
        JOIN clubes c ON c.organization_id = cc.clube_org_id
        JOIN equipas e ON e.id = cc.equipa_id
        JOIN users sender ON sender.id = cc.convidado_por
        WHERE cc.convidado_user_id = ${user.id}
          AND cc.tipo = 'treinador'
          AND cc.estado = 'pendente'
        ORDER BY cc.created_at DESC
    `.catch(() => []);

    return rows.map((r) => ({
        id: r.id,
        tipo: "convite_clube" as const,
        titulo: `Convite do Clube "${r.clube_nome}"`,
        descricao: `${r.convidado_por_nome} convidou-te para a equipa "${r.equipa_nome}" do clube "${r.clube_nome}".`,
        created_at: r.created_at,
    }));
}
