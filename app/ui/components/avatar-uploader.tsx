// Componente avatar uploader.
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Loader2, User } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
    currentImageUrl: string | null;
    userName: string;
    disabled?: boolean;
    placeholderUrl?: string;
}

export default function AvatarUploader({
    currentImageUrl,
    userName,
    disabled,
    placeholderUrl,
}: Props) {
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const displayUrl = preview || currentImageUrl || placeholderUrl;

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validação rápida no cliente
        if (!file.type.startsWith("image/")) {
            setError("Selecione um ficheiro de imagem.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("Ficheiro demasiado grande. Máximo 5 MB.");
            return;
        }

        setError(null);
        setPreview(URL.createObjectURL(file));
        setUploading(true);

        try {
            const formData = new FormData();
            formData.set("avatar", file);

            const res = await fetch("/api/avatar", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Erro ao fazer upload.");
                setPreview(null);
                return;
            }

            // Atualizar componentes do servidor com a nova imagem
            router.refresh();
            window.dispatchEvent(new Event("avatar-updated"));
        } catch {
            setError("Erro de rede ao fazer upload.");
            setPreview(null);
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <button
                type="button"
                onClick={() => !disabled && inputRef.current?.click()}
                disabled={uploading || disabled}
                className={`relative group ${disabled ? "cursor-default" : "cursor-pointer"}`}
                title={
                    disabled
                        ? "Apenas o responsável pode alterar a foto"
                        : "Alterar foto de perfil"
                }
            >
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-900 shadow-md">
                    {displayUrl ? (
                        <Image
                            src={displayUrl}
                            alt={userName}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                            unoptimized={!!preview}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <User size={32} className="text-gray-400" />
                        </div>
                    )}
                </div>

                {/* Sobreposi��o ao passar */}
                {!disabled && (
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {uploading ? (
                            <Loader2
                                size={20}
                                className="text-white animate-spin"
                            />
                        ) : (
                            <Camera size={20} className="text-white" />
                        )}
                    </div>
                )}

                {/* Indicador de estado */}
                <span className="absolute bottom-0 right-0 bg-green-500 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900" />
            </button>

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
            />

            {!disabled && (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium cursor-pointer disabled:opacity-50"
                >
                    {uploading ? "A enviar..." : "Alterar foto"}
                </button>
            )}

            {error && (
                <p className="text-xs text-red-500 text-center max-w-[200px]">
                    {error}
                </p>
            )}
        </div>
    );
}
