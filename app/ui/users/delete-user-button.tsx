// app/ui/users/delete-user-button.tsx
"use client";

import {
    TrashIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useFormStatus } from "react-dom";
import { useState } from "react";

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-gray-700 p-2 hover:bg-red-500/10 hover:border-red-500/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            title="Deletar utilizador"
        >
            <span className="sr-only">Delete</span>
            <TrashIcon className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
        </button>
    );
}

export function DeleteUserButton({
    id,
    deleteAction,
    isAdmin,
}: {
    id: string;
    deleteAction: (id: string) => Promise<void>;
    isAdmin?: boolean;
}) {
    const [showModal, setShowModal] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (isAdmin) {
            // Admin deletion requires modal confirmation
            setShowModal(true);
        } else {
            // Regular user deletion
            if (!confirm("Tem certeza que deseja deletar este utilizador?")) {
                return;
            }
            setIsDeleting(true);
            try {
                await deleteAction(id);
            } catch (error) {
                console.error(error);
                alert("Erro ao deletar utilizador");
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const handleAdminDelete = async () => {
        if (confirmText !== "deletarconta") {
            return;
        }

        setIsDeleting(true);
        try {
            await deleteAction(id);
            setShowModal(false);
        } catch (error) {
            console.error(error);
            alert("Erro ao deletar conta de administrador");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit}>
                <SubmitButton />
            </form>

            {/* Modal for Admin Deletion */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-xl border border-red-500/20 max-w-md w-full p-6 shadow-xl">
                        {/* Header */}
                        <div className="flex items-start gap-3 mb-4">
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white">
                                    Deletar Conta de Administrador
                                </h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    Esta ação é irreversível
                                </p>
                            </div>
                        </div>

                        {/* Warning */}
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                            <p className="text-sm text-red-400 font-medium mb-2">
                                ⚠️ Atenção: Esta ação irá:
                            </p>
                            <ul className="text-sm text-red-300 space-y-1 list-disc list-inside">
                                <li>
                                    Excluir permanentemente sua conta de
                                    administrador
                                </li>
                                <li>Remover todos os dados da organização</li>
                                <li>
                                    Excluir todos os clientes, faturas e
                                    utilizadores associados
                                </li>
                            </ul>
                        </div>

                        {/* Confirmation Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Para confirmar, digite{" "}
                                <span className="text-red-400 font-mono">
                                    deletarconta
                                </span>
                            </label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                className="block w-full rounded-lg border border-gray-700 bg-gray-800 py-2 px-3 text-sm text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                placeholder="Digite deletarconta"
                                disabled={isDeleting}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowModal(false);
                                    setConfirmText("");
                                }}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleAdminDelete}
                                disabled={
                                    confirmText !== "deletarconta" || isDeleting
                                }
                                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? "Deletando..." : "Deletar Conta"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
