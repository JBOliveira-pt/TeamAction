import { fetchNotasCalendario } from "@/app/lib/data/notas-calendario";
import NotasCalendarioClient from "./notas-calendario-client";

export const dynamic = "force-dynamic";

export default async function NotasUnificadas({
    contaPendente = false,
}: {
    contaPendente?: boolean;
}) {
    const notas = await fetchNotasCalendario();
    return (
        <NotasCalendarioClient notas={notas} contaPendente={contaPendente} />
    );
}
