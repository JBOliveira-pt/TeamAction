// Dashboard principal do treinador: equipas, staff e estatísticas.
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import postgres from "postgres";
import StaffPanel from "./staff-panel.client";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function fetchDashboardData() {
    const { userId } = await auth();
    if (!userId) return null;

    const userRows = await sql<
        { id: string; name: string; organization_id: string }[]
    >`
        SELECT id, name, organization_id FROM users WHERE clerk_user_id = ${userId} LIMIT 1
    `;
    const user = userRows[0];
    if (!user) return null;

    const orgId = user.organization_id;
    const hoje = new Date().toISOString().split("T")[0];

    // Buscar todas as equipas do treinador
    const equipaRows = await sql<{ id: string; nome: string }[]>`
        SELECT id, nome FROM equipas WHERE treinador_id = ${user.id} ORDER BY nome ASC
    `;
    const hasEquipas = equipaRows.length > 0;

    // Verificar se o treinador está vinculado a um clube
    const clubeRows = await sql<{ id: string }[]>`
        SELECT id FROM clubes WHERE organization_id = ${orgId} LIMIT 1
    `.catch(() => []);
    const temClube = clubeRows.length > 0;

    const [
        atletasResult,
        proximaSessaoResult,
        proximoJogoResult,
        ultimasSessoesResult,
        assiduidadeResult,
    ] = await Promise.all([
        // Total atletas: do clube (se vinculado) ou das equipas do treinador
        temClube
            ? sql<{ total: number }[]>`
                SELECT COUNT(*)::int AS total FROM atletas
                WHERE organization_id = ${orgId}
            `
            : hasEquipas
              ? sql<{ total: number }[]>`
                  SELECT COUNT(*)::int AS total FROM atletas
                  WHERE organization_id = ${orgId}
                    AND equipa_id IN (SELECT id FROM equipas WHERE treinador_id = ${user.id})
              `
              : Promise.resolve([{ total: 0 }]),
        // Próximas sessões (usamos até 3 para os eventos)
        hasEquipas
            ? sql<
                  {
                      id: string;
                      data: string;
                      tipo: string;
                      duracao_min: number;
                  }[]
              >`
                SELECT id, data::text, tipo, duracao_min FROM sessoes
                WHERE treinador_id = ${user.id} AND data >= ${hoje}::date
                ORDER BY data ASC LIMIT 3
            `
            : Promise.resolve([]),
        // Próximos jogos de todas as equipas do treinador
        hasEquipas
            ? sql<
                  {
                      id: string;
                      adversario: string;
                      data: string;
                      casa_fora: string;
                  }[]
              >`
                SELECT id, adversario, data::text, casa_fora FROM jogos
                WHERE equipa_id IN (SELECT id FROM equipas WHERE treinador_id = ${user.id})
                  AND estado = 'agendado' AND data >= ${hoje}::date
                ORDER BY data ASC LIMIT 3
            `
            : Promise.resolve([]),
        // Últimas 3 sessões
        hasEquipas
            ? sql<{ id: string; data: string; tipo: string }[]>`
                SELECT id, data::text, tipo FROM sessoes
                WHERE treinador_id = ${user.id}
                ORDER BY data DESC LIMIT 3
            `
            : Promise.resolve([]),
        // Assiduidade
        hasEquipas
            ? sql<{ total: number; presencas: number }[]>`
                SELECT
                    COUNT(*)::int AS total,
                    SUM(CASE WHEN estado = 'P' THEN 1 ELSE 0 END)::int AS presencas
                FROM assiduidade
                WHERE sessao_id IN (
                    SELECT id FROM sessoes WHERE treinador_id = ${user.id}
                )
            `
            : Promise.resolve([{ total: 0, presencas: 0 }]),
    ]).catch(() => [null, null, null, null, null]);

    const staffResult =
        hasEquipas && temClube
            ? await sql<
                  {
                      id: string;
                      nome: string;
                      funcao: string;
                      user_id: string | null;
                  }[]
              >`
            SELECT DISTINCT ON (s.user_id, s.nome) s.id, s.nome, s.funcao, s.user_id FROM staff s
            WHERE s.equipa_id IN (SELECT id FROM equipas WHERE treinador_id = ${user.id})
            ORDER BY s.user_id, s.nome, s.funcao ASC
        `.catch(() => [])
            : [];

    // Atleta mais assíduo
    const atletaDestaqueResult = hasEquipas
        ? await sql<{ nome: string; pct: number }[]>`
            SELECT a.nome,
                   ROUND(100.0 * SUM(CASE WHEN ass.estado = 'P' THEN 1 ELSE 0 END) / NULLIF(COUNT(ass.id), 0))::int AS pct
            FROM assiduidade ass
            JOIN atletas a ON a.id = ass.atleta_id
            WHERE ass.sessao_id IN (
                SELECT id FROM sessoes WHERE treinador_id = ${user.id}
            )
            GROUP BY a.id, a.nome
            HAVING COUNT(ass.id) >= 3
            ORDER BY pct DESC LIMIT 1
        `.catch(() => [])
        : [];

    const totalAtletas = atletasResult?.[0]?.total ?? 0;
    const proximasSessoes = (proximaSessaoResult ?? []) as {
        id: string;
        data: string;
        tipo: string;
        duracao_min: number;
    }[];
    const proximosJogos = (proximoJogoResult ?? []) as {
        id: string;
        adversario: string;
        data: string;
        casa_fora: string;
    }[];
    const proximaSessao = proximasSessoes[0] ?? null;
    const proximoJogo = proximosJogos[0] ?? null;
    const ultimasSessoes = ultimasSessoesResult ?? [];
    const totalRegistos = assiduidadeResult?.[0]?.total ?? 0;
    const totalPresencas = assiduidadeResult?.[0]?.presencas ?? 0;
    const pctAssiduidade =
        totalRegistos > 0
            ? Math.round((totalPresencas / totalRegistos) * 100)
            : null;
    const atletaDestaque = atletaDestaqueResult?.[0] ?? null;

    // Mistura sessões e jogos futuros, ordena por data, retém os 3 mais próximos
    const proximosEventos = [
        ...proximasSessoes.map((s) => ({
            id: s.id,
            data: s.data,
            tipo: "sessao" as const,
            titulo: s.tipo,
            subtitulo: `${s.duracao_min} min`,
        })),
        ...proximosJogos.map((j) => ({
            id: j.id,
            data: j.data,
            tipo: "jogo" as const,
            titulo: `vs ${j.adversario}`,
            subtitulo: j.casa_fora === "casa" ? "Casa" : "Fora",
        })),
    ]
        .sort((a, b) => a.data.localeCompare(b.data))
        .slice(0, 3);

    return {
        nome: user.name,
        totalAtletas,
        proximaSessao,
        proximoJogo,
        ultimasSessoes,
        pctAssiduidade,
        atletaDestaque,
        proximosEventos,
        staff: staffResult,
        hasEquipa: hasEquipas,
        equipas: equipaRows,
        temClube,
    };
}

function formatData(iso: string) {
    return new Date(iso).toLocaleDateString("pt-PT", {
        day: "numeric",
        month: "short",
    });
}

export default async function TreinadorDashboard() {
    const data = await fetchDashboardData();

    const nome = data?.nome ?? "Treinador";
    const primeiroNome = nome.split(" ")[0];

    return (
        <div className="flex w-full min-h-screen">
            <div className="flex-1 bg-gray-100 dark:bg-gray-900 p-6 flex flex-col gap-8">
                {/* ── Cabeçalho ── */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                            Olá,{" "}
                            <span className="text-blue-600 dark:text-blue-400">
                                {primeiroNome}
                            </span>{" "}
                            👋
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {data?.totalAtletas ?? 0} atletas
                            {data?.equipas && data.equipas.length > 0 && (
                                <span>
                                    {" "}
                                    · {data.equipas.length} equipa
                                    {data.equipas.length > 1 ? "s" : ""}
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Link
                            href="/dashboard/treinador/sessoes?nova=1"
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold text-sm shadow hover:bg-purple-700 transition-all"
                        >
                            Nova Sessão
                        </Link>
                        <Link
                            href="/dashboard/treinador/jogos?novo=1"
                            className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold text-sm shadow hover:bg-amber-700 transition-all"
                        >
                            + Novo Jogo
                        </Link>
                    </div>
                </div>

                {/* ── Cards de destaque ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                    {/* Próxima sessão */}
                    <div className="rounded-2xl bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 p-6 shadow-sm flex flex-col gap-2">
                        <span className="text-3xl">🏋️</span>
                        <h3 className="font-bold text-sm text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                            Próxima Sessão
                        </h3>
                        {data?.proximaSessao ? (
                            <>
                                <p className="font-bold text-gray-800 dark:text-gray-100">
                                    {data.proximaSessao.tipo}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {formatData(data.proximaSessao.data)} ·{" "}
                                    {data.proximaSessao.duracao_min} min
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-gray-400">
                                Sem sessões agendadas
                            </p>
                        )}
                    </div>

                    {/* Próximo jogo */}
                    <div className="rounded-2xl bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 p-6 shadow-sm flex flex-col gap-2">
                        <span className="text-3xl">🏆</span>
                        <h3 className="font-bold text-sm text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                            Próximo Jogo
                        </h3>
                        {data?.proximoJogo ? (
                            <>
                                <p className="font-bold text-gray-800 dark:text-gray-100 truncate">
                                    vs {data.proximoJogo.adversario}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {formatData(data.proximoJogo.data)} ·{" "}
                                    {data.proximoJogo.casa_fora === "casa"
                                        ? "Casa"
                                        : "Fora"}
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-gray-400">
                                Sem jogos agendados
                            </p>
                        )}
                    </div>

                    {/* Assiduidade */}
                    <div className="rounded-2xl bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 p-6 shadow-sm flex flex-col gap-2">
                        <span className="text-3xl">📈</span>
                        <h3 className="font-bold text-sm text-green-700 dark:text-green-300 uppercase tracking-wide">
                            Assiduidade
                        </h3>
                        {data?.pctAssiduidade != null ? (
                            <>
                                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                    {data.pctAssiduidade}%
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    média geral
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-gray-400">
                                Sem registos ainda
                            </p>
                        )}
                    </div>

                    {/* Atleta em destaque */}
                    <div className="rounded-2xl bg-white dark:bg-gray-800 border border-yellow-200 dark:border-yellow-700 p-6 shadow-sm flex flex-col gap-2">
                        <span className="text-3xl">⭐</span>
                        <h3 className="font-bold text-sm text-yellow-700 dark:text-yellow-300 uppercase tracking-wide">
                            Atleta em Destaque
                        </h3>
                        {data?.atletaDestaque ? (
                            <>
                                <p className="font-bold text-gray-800 dark:text-gray-100">
                                    {data.atletaDestaque.nome}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Assiduidade: {data.atletaDestaque.pct}%
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-gray-400">
                                Sem dados suficientes
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Últimas sessões + Próximos Eventos + Plantel ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {/* Últimas sessões */}
                    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 shadow-sm flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-base text-gray-900 dark:text-white">
                                Últimas Sessões
                            </h3>
                            <Link
                                href="/dashboard/treinador/sessoes"
                                className="text-xs text-blue-500 hover:underline"
                            >
                                Ver todas →
                            </Link>
                        </div>
                        {data?.ultimasSessoes?.length ? (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                                {data.ultimasSessoes.map((s) => (
                                    <li
                                        key={s.id}
                                        className="flex items-center justify-between py-2 text-sm"
                                    >
                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                            {s.tipo}
                                        </span>
                                        <span className="text-gray-400 text-xs">
                                            {formatData(s.data)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-400">
                                Nenhuma sessão registada ainda.
                            </p>
                        )}
                    </div>

                    {/* Próximos Eventos */}
                    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 shadow-sm flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-base text-gray-900 dark:text-white">
                                Próximos Eventos
                            </h3>
                            <Link
                                href="/dashboard/treinador/calendario"
                                className="text-xs text-blue-500 hover:underline"
                            >
                                Ver calendário →
                            </Link>
                        </div>
                        {data?.proximosEventos?.length ? (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                                {data.proximosEventos.map((ev) => (
                                    <li
                                        key={`${ev.tipo}-${ev.id}`}
                                        className="flex items-center gap-3 py-2.5"
                                    >
                                        <span className="text-xl flex-shrink-0">
                                            {ev.tipo === "sessao" ? "🏋️" : "🏆"}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                                                {ev.titulo}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {ev.subtitulo}
                                            </p>
                                        </div>
                                        <span className="text-xs text-gray-400 flex-shrink-0">
                                            {formatData(ev.data)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-400">
                                Sem eventos agendados.
                            </p>
                        )}
                    </div>

                    {/* Plantel */}
                    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 shadow-sm flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-base text-gray-900 dark:text-white">
                                Plantel
                            </h3>
                            <Link
                                href="/dashboard/treinador/equipas"
                                className="text-xs text-blue-500 hover:underline"
                            >
                                Ver equipas →
                            </Link>
                        </div>
                        {data?.hasEquipa ? (
                            <div className="flex items-center gap-4 py-2">
                                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex-shrink-0">
                                    <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                                        {data.totalAtletas}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        atletas
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                        {data.equipas && data.equipas.length > 1
                                            ? `em ${data.equipas.length} equipas`
                                            : (data.equipas?.[0]?.nome ??
                                              "na equipa")}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">
                                Sem equipa atribuída.
                            </p>
                        )}
                    </div>
                </div>
            </div>
            {data?.temClube && data?.hasEquipa && (
                <StaffPanel staff={data.staff ?? []} />
            )}
        </div>
    );
}
