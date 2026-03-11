import { UserCircleIcon, EnvelopeIcon, BuildingOfficeIcon, CreditCardIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { PresidentePerfil, Organization } from '@/app/lib/definitions';

// Mock data (substituir por query real depois)
const mockOrganization: Organization = {
    id: 'org-1',
    name: 'Sporting Clube de Exemplo',
    slug: 'sporting-exemplo',
    owner_id: 'user-1',
    created_at: '2023-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
};

const mockPresidente: PresidentePerfil = {
    id: 'user-1',
    name: 'João Silva',
    email: 'joao.silva@clube.pt',
    image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=joao',
    role: 'admin',
    organization_id: 'org-1',
    iban: 'PT50 0002 0123 1234 5678 9015 4',
    organization: mockOrganization,
};

export default function PerfilPage() {
    const presidente = mockPresidente;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Perfil</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Informações da tua conta e do clube</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Card Principal */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center text-center space-y-4">
                        {/* Avatar */}
                        <div className="relative">
                            <img
                                src={presidente.image_url}
                                alt={presidente.name}
                                className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-900 shadow-md"
                            />
                            <span className="absolute bottom-0 right-0 bg-green-500 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900" />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{presidente.name}</h2>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 mt-1">
                                Presidente
                            </span>
                        </div>

                        <div className="w-full pt-2 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Clube</p>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5">
                                {presidente.organization?.name}
                            </p>
                        </div>

                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                            <PencilSquareIcon className="w-4 h-4" />
                            Editar Perfil
                        </button>
                    </div>
                </div>

                {/* Detalhes */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Informações Pessoais */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                            <UserCircleIcon className="w-5 h-5 text-blue-500" />
                            Informações Pessoais
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Nome completo</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{presidente.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Função</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">Presidente</p>
                            </div>
                        </div>
                    </div>

                    {/* Contacto */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                            <EnvelopeIcon className="w-5 h-5 text-blue-500" />
                            Contacto
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{presidente.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Clube */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                            <BuildingOfficeIcon className="w-5 h-5 text-blue-500" />
                            Clube
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Nome</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{presidente.organization?.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Slug</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{presidente.organization?.slug}</p>
                            </div>
                        </div>
                    </div>

                    {/* Financeiro */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                            <CreditCardIcon className="w-5 h-5 text-blue-500" />
                            Financeiro
                        </h3>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">IBAN</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5 font-mono">
                                {presidente.iban ?? 'Não definido'}
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
