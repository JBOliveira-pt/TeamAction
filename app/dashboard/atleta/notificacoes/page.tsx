import NotificacoesUnificadas from "@/app/ui/components/notificacoes-unificadas";
import VinculacaoResponsavelSection from "./vinculacao-responsavel-section";

export const dynamic = "force-dynamic";

export default function AtletaNotificacoesPage() {
    return (
        <div className="space-y-6">
            <div className="px-6 pt-6">
                <VinculacaoResponsavelSection />
            </div>
            <NotificacoesUnificadas />
        </div>
    );
}
