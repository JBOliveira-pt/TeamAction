'use client';

import { aprovarPerfilAtleta } from '@/app/lib/actions';
import { CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export default function AprovarPerfilButton({
    minorUserId,
}: {
    minorUserId: string;
}) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    function handleAprovar() {
        setError(null);
        startTransition(async () => {
            const result = await aprovarPerfilAtleta(minorUserId);
            if (result?.error) {
                setError(result.error);
            } else {
                router.refresh();
            }
        });
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <button
                onClick={handleAprovar}
                disabled={isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
                <CheckCircle size={15} />
                {isPending ? 'A aprovar…' : 'Aprovar perfil'}
            </button>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}
