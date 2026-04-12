// Página admin de gestão de subscritores da newsletter.
import { fetchAdminNewsletterSubscribers } from "@/app/lib/admin-data";
import { SendThankYouButton } from "./_components/SendThankYouButton.client";
import { CheckCircle, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage() {
    const subscribers = await fetchAdminNewsletterSubscribers();

    const total = subscribers.length;
    const thanked = subscribers.filter((s) => s.thanked_at).length;
    const pending = total - thanked;

    return (
        <div className="space-y-4">
            <header>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Inscrições Newsletter
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gerencie os inscritos na newsletter e envie e-mails de
                    agradecimento.
                </p>
            </header>

            {/* Estat�sticas */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Total de Inscritos
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {total}
                    </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Agradecimentos Enviados
                    </p>
                    <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {thanked}
                    </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Pendentes de Agradecimento
                    </p>
                    <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {pending}
                    </p>
                </div>
            </div>

            {/* Tabela */}
            {subscribers.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                    Nenhuma inscrição registada.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-800">
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Nome
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    E-mail
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Data de Inscrição
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Estado
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Ação
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {subscribers.map((sub) => (
                                <tr
                                    key={sub.id}
                                    className="transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                >
                                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                                        {sub.nome}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">
                                        <a
                                            href={`mailto:${sub.email}`}
                                            className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400"
                                        >
                                            <Mail className="h-3.5 w-3.5" />
                                            {sub.email}
                                        </a>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400">
                                        {new Date(
                                            sub.subscribed_at,
                                        ).toLocaleString("pt-PT")}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        {sub.thanked_at ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                                <CheckCircle className="h-3 w-3" />
                                                Agradecido
                                            </span>
                                        ) : (
                                            <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                                Pendente
                                            </span>
                                        )}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        {sub.thanked_at ? (
                                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                                Enviado em{" "}
                                                {new Date(
                                                    sub.thanked_at,
                                                ).toLocaleString("pt-PT")}
                                            </span>
                                        ) : (
                                            <SendThankYouButton
                                                subscriberId={sub.id}
                                                subscriberName={sub.nome}
                                            />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
