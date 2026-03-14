"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { FormEvent, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

type AdminUserOption = {
    id: string;
    name: string;
    email: string;
};

function SubmitAvisoButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
        >
            {pending ? "A enviar..." : "Emitir aviso"}
        </button>
    );
}

export function AdminAvisoForm({
    users,
    action,
}: {
    users: AdminUserOption[];
    action: (formData: FormData) => Promise<void>;
}) {
    const [showModal, setShowModal] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const allowSubmitRef = useRef(false);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        if (allowSubmitRef.current) {
            allowSubmitRef.current = false;
            return;
        }

        event.preventDefault();
        setShowModal(true);
    };

    const confirmSubmit = () => {
        allowSubmitRef.current = true;
        setShowModal(false);
        formRef.current?.requestSubmit();
    };

    return (
        <>
            <form
                ref={formRef}
                action={action}
                onSubmit={handleSubmit}
                className="max-w-2xl space-y-3 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
            >
                <div>
                    <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
                        Titulo
                    </label>
                    <input
                        name="titulo"
                        required
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
                        Descricao
                    </label>
                    <textarea
                        name="descricao"
                        required
                        rows={4}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
                        Destinatario
                    </label>
                    <select
                        name="scope"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                    >
                        <option value="all">Todos os utilizadores</option>
                        <option value="user">Utilizador especifico</option>
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
                        Utilizador (opcional)
                    </label>
                    <select
                        name="userId"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                    >
                        <option value="">-- Nenhum --</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.name} ({user.email})
                            </option>
                        ))}
                    </select>
                </div>

                <SubmitAvisoButton />
            </form>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
                        <div className="mb-4 flex items-start gap-3">
                            <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
                                <ExclamationTriangleIcon className="h-6 w-6 text-amber-700" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Confirmar envio de aviso
                                </h3>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    Tem a certeza que deseja enviar este aviso
                                    agora?
                                </p>
                            </div>
                        </div>

                        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300">
                            O envio sera executado imediatamente para o destino
                            selecionado.
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={confirmSubmit}
                                className="flex-1 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                            >
                                Confirmar envio
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
