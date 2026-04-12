// Página de staff do presidente.
import { fetchStaff, fetchEquipas, fetchUsersForStaff } from "@/app/lib/data";
import { AdicionarMembroModal } from "./_components/AdicionarMembroModal.client";
import { AdicionarTreinadorModal } from "./_components/AdicionarTreinadorModal.client";
import StaffTable from "./_components/StaffTable.client";

export const dynamic = "force-dynamic";

type EquipaRow = {
    id: string;
    nome: string;
    escalao: string;
    desporto: string | null;
};

type UserRow = {
    id: string;
    name: string;
    email: string;
    image_url: string | null;
};

export default async function StaffPage() {
    const [staff, equipas, users] = await Promise.all([
        fetchStaff(),
        fetchEquipas(),
        fetchUsersForStaff(),
    ]);

    const equipasProps = (equipas as EquipaRow[]).map((e) => ({
        id: e.id,
        nome: e.nome,
        escalao: e.escalao ?? "",
    }));

    const usersProps = (users as UserRow[]).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        imageurl: u.image_url,
    }));

    const treinadoresPrincipais = staff.filter(
        (s) => s.funcao === "Treinador Principal",
    ).length;
    const treinadoresAdjuntos = staff.filter(
        (s) => s.funcao === "Treinador Adjunto",
    ).length;
    const semEquipa = staff.filter((s) => !s.equipa_id).length;

    return (
        <div className="p-6 space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Staff
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {staff.length}{" "}
                        {staff.length === 1
                            ? "membro registado"
                            : "membros registados"}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <AdicionarTreinadorModal equipas={equipasProps} />
                    <AdicionarMembroModal equipas={equipasProps} />
                </div>
            </div>

            {/* Cards resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 border border-cyan-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Total
                    </p>
                    <p className="text-3xl font-bold text-cyan-400 mt-2">
                        {staff.length}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-violet-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Tren. Principais
                    </p>
                    <p className="text-3xl font-bold text-violet-400 mt-2">
                        {treinadoresPrincipais}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-blue-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Tren. Adjuntos
                    </p>
                    <p className="text-3xl font-bold text-blue-400 mt-2">
                        {treinadoresAdjuntos}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-amber-500/30 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Sem Equipa
                    </p>
                    <p className="text-3xl font-bold text-amber-400 mt-2">
                        {semEquipa}
                    </p>
                </div>
            </div>

            {/* Tabela com filtros */}
            <StaffTable
                staff={staff}
                equipas={equipasProps}
                users={usersProps}
            />
        </div>
    );
}
