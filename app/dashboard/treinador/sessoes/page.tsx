import Sessoes from "./sessoes.client";
import { fetchEquipas } from "@/app/lib/data";

export default async function SessoesPage({
    searchParams,
}: {
    searchParams: Promise<{ nova?: string }>;
}) {
    let equipas: { id: string; nome: string }[] = [];
    try {
        equipas = await fetchEquipas();
    } catch {
        equipas = [];
    }

    const params = await searchParams;
    const autoOpenModal = params.nova === "1";

    return <Sessoes equipas={equipas} autoOpenModal={autoOpenModal} />;
}
