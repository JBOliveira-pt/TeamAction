// Página de notificacoes do treinador.
import NotificacoesUnificadas from "@/app/ui/components/notificacoes-unificadas";
import { fetchAutorizacoesTreinador } from "@/app/lib/actions/convites-treinador";
import ConviteClubeBanner from "./convite-clube-banner.client";

export const dynamic = "force-dynamic";

export default async function TreinadorNotificacoesPage() {
    const convites = await fetchAutorizacoesTreinador();

    return (
        <div className="space-y-0">
            {convites.length > 0 && (
                <div className="px-6 pt-6">
                    <ConviteClubeBanner convites={convites} />
                </div>
            )}
            <NotificacoesUnificadas />
        </div>
    );
}
