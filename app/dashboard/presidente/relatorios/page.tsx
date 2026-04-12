// Página de relatorios do presidente.
import { fetchRelatoriosMetadata } from "@/app/lib/data";
import RelatoriosClient from "./_components/relatorios-client";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
    const metadata = await fetchRelatoriosMetadata();
    return <RelatoriosClient metadata={metadata} />;
}

