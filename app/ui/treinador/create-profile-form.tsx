// ...existing code...
// Formulário de criação de perfil do treinador
export default function CreateTreinadorProfileForm() {
    return (
        <form>
            <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 md:p-8 space-y-8">
                {/* Header */}
                <h2 className="text-xl font-bold">Criar perfil do treinador</h2>
                {/* Campos do formulário */}
                <input className="input" placeholder="Nome do treinador" />
                <input className="input" placeholder="Email" />
                <input className="input" placeholder="Telefone" />
                {/* Botão */}
                <button className="btn btn-primary mt-4">Criar</button>
            </div>
        </form>
    );
}
