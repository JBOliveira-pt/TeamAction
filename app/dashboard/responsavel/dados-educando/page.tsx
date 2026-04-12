// Página de dados educando do responsável.
import { fetchDadosEducando } from "@/app/lib/data/responsavel";
import EditarDadosEducandoForm from "./_components/EditarDadosEducandoForm.client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DadosEducandoPage() {
    const dados = await fetchDadosEducando();
    if (!dados) redirect("/dashboard/responsavel");

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Dados do Atleta
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Gerir dados cadastrais e desportivos do atleta menor
                </p>
            </div>

            <EditarDadosEducandoForm dados={dados} />
        </div>
    );
}
