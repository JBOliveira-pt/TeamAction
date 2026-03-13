// ...existing code...
// Formulário de edição de perfil do treinador
export default function EditTreinadorProfileForm({
    treinador,
}: {
    treinador: any;
}) {
    return (
        <form>
            <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 md:p-8 space-y-8">
                {/* Header */}
                <h2 className="text-xl font-bold">
                    Editar perfil do treinador
                </h2>
                {/* Campos do formulário */}
                <input
                    className="input"
                    placeholder="Nome do treinador"
                    defaultValue={treinador?.nome}
                />
                <input
                    className="input"
                    placeholder="Email"
                    defaultValue={treinador?.email}
                />
                <input
                    className="input"
                    placeholder="Telefone"
                    defaultValue={treinador?.telefone}
                />
                {/* Botão */}
                <button className="btn btn-primary mt-4">Salvar</button>
            </div>
        </form>
    );
}
