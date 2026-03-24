import Sessoes from "./sessoes";
import { fetchEquipas } from "@/app/lib/data";

export default async function SessoesPage() {
    let equipas: { id: string; nome: string }[] = [];
    try {
        equipas = await fetchEquipas();
    } catch {
        equipas = [];
    }

    return <Sessoes equipas={equipas} />;
}
