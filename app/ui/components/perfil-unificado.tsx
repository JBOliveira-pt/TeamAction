import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { fetchMeuPerfil, fetchPerfilAtletaGeral } from "@/app/lib/data";
import { fetchPedidosAlteracaoPerfil } from "@/app/lib/actions/pedidos-perfil";
import PerfilInlineEditor from "@/app/ui/components/editar-perfil-modal";
import AvatarUploader from "@/app/ui/components/avatar-uploader";
import Image from "next/image";
import { ShieldCheck, ShieldAlert, Mail, UserCheck } from "lucide-react";
import InfoDesportivaCard from "@/app/ui/components/info-desportiva-card";

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
    presidente: "Presidente",
    treinador: "Treinador",
    atleta: "Atleta",
    responsavel: "Responsável",
};

export default async function PerfilUnificadoPage() {
    const clerkUser = await currentUser();
    if (!clerkUser) redirect("/login");

    const perfil = await fetchMeuPerfil();
    if (!perfil) redirect("/login");

    const pedidosPendentes = await fetchPedidosAlteracaoPerfil();

    const nome =
        clerkUser.fullName ??
        `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim();
    const email =
        clerkUser.emailAddresses[0]?.emailAddress ?? perfil.email ?? "—";
    const firstName = clerkUser.firstName ?? "";
    const lastName = clerkUser.lastName ?? "";
    const accountLabel =
        ACCOUNT_TYPE_LABELS[perfil.account_type ?? ""] ?? "Utilizador";

    const membroDesde = new Date(perfil.created_at).toLocaleDateString(
        "pt-PT",
        { day: "2-digit", month: "long", year: "numeric" },
    );

    const dataNascimentoISO = perfil.data_nascimento
        ? typeof perfil.data_nascimento === "string"
            ? perfil.data_nascimento.slice(0, 10)
            : new Date(perfil.data_nascimento).toISOString().slice(0, 10)
        : null;

    // Usar image_url da DB (sincronizada com Clerk) ou fallback do Clerk
    const avatarUrl = perfil.image_url || clerkUser.imageUrl || null;

    // Dados específicos do atleta (responsável + info desportiva)
    const atletaData =
        perfil.account_type === "atleta"
            ? await fetchPerfilAtletaGeral()
            : null;

    return (
        <div className="p-6 space-y-5 max-w-5xl mx-auto">
            {/* Header card compacto: avatar + info lado a lado */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    <AvatarUploader
                        currentImageUrl={avatarUrl}
                        userName={nome}
                    />

                    <div className="flex-1 text-center sm:text-left">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {nome}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 justify-center sm:justify-start">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                {accountLabel}
                            </span>
                            {perfil.org_name && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    · {perfil.org_name}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            Membro desde {membroDesde}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Cards específicos do Atleta ── */}
            {perfil.account_type === "atleta" && atletaData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Card Responsável */}
                    {atletaData.user.menor_idade && (
                        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-4">
                                <UserCheck
                                    size={18}
                                    className="text-blue-500"
                                />
                                Responsável (Encarregado de Educação)
                            </h3>
                            {atletaData.guardian ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                                            {atletaData.guardian.image_url ? (
                                                <Image
                                                    src={
                                                        atletaData.guardian
                                                            .image_url
                                                    }
                                                    alt={
                                                        atletaData.guardian.name
                                                    }
                                                    width={40}
                                                    height={40}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-bold">
                                                    {atletaData.guardian.name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {atletaData.guardian.name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                <Mail size={12} />
                                                {atletaData.guardian.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {atletaData.user.status ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                                <ShieldCheck size={14} />
                                                Conta autorizada
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                                                <ShieldAlert size={14} />
                                                Aguarda autorização
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {atletaData.user.encarregado_educacao
                                            ? `Convite enviado para ${atletaData.user.encarregado_educacao}`
                                            : "Nenhum responsável associado."}
                                    </p>
                                    {atletaData.user.encarregado_educacao && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                                            <ShieldAlert size={14} />
                                            Aguarda autorização
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Card Informações Desportivas */}
                    <InfoDesportivaCard
                        pesoKg={atletaData.user.peso_kg}
                        alturaCm={atletaData.user.altura_cm}
                        maoDominante={atletaData.atleta?.mao_dominante ?? null}
                        equipaNome={atletaData.atleta?.equipa_nome ?? null}
                        federado={atletaData.atleta?.federado ?? null}
                        treinadorNome={
                            atletaData.atleta?.treinador_nome ?? null
                        }
                    />
                </div>
            )}

            {/* Secções de edição inline — full-width */}
            <PerfilInlineEditor
                firstName={firstName}
                lastName={lastName}
                email={email}
                telefone={perfil.telefone}
                morada={perfil.morada}
                cidade={perfil.cidade}
                codigoPostal={perfil.codigo_postal}
                pais={perfil.pais}
                dataNascimento={dataNascimentoISO}
                nif={perfil.nif}
                iban={perfil.iban}
                accountType={perfil.account_type}
                orgName={perfil.org_name}
                membroDesde={membroDesde}
                pedidosPendentes={pedidosPendentes.map((p) => ({
                    campo: p.campo,
                    valor_novo: p.valor_novo,
                }))}
            />
        </div>
    );
}
