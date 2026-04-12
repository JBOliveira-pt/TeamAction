// Página de login do administrador.
import { adminLoginAction } from "@/app/lib/admin-actions";
import {
    getAdminSessionFromCookie,
    isAdminSessionTokenValid,
} from "@/app/lib/admin-auth";
import Image from "next/image";
import { ASSETS } from "@/app/lib/assets";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type SearchParams = {
    error?: string;
};

function getAlertFromParams(searchParams?: SearchParams) {
    if (!searchParams?.error) {
        return null;
    }

    if (searchParams.error === "1") {
        return "Senha de administrador inválida.";
    }

    if (searchParams.error === "config") {
        return "Erro de configuração do servidor. Verifique o hash ADMIN_LOGIN_PASSWORD_HASH.";
    }

    return "Não foi possível concluir o login. Tente novamente.";
}

export default async function AdminLoginPage({
    searchParams,
}: {
    searchParams?: Promise<SearchParams>;
}) {
    const token = await getAdminSessionFromCookie();
    if (isAdminSessionTokenValid(token)) {
        redirect("/admin");
    }

    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const alert = getAlertFromParams(resolvedSearchParams);

    return (
        <main
            className="min-h-screen flex items-center justify-center p-6 bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage: `url('${ASSETS.loginBackground}')`,
            }}
        >
            <div className="w-full max-w-md rounded-3xl border border-blue-200/20 bg-slate-950/60 p-6 shadow-[0_24px_64px_-24px_rgba(2,6,23,0.95)] backdrop-blur-xl backdrop-saturate-150">
                <div className="mb-4 flex items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-blue-200/30 bg-slate-950/70 shadow-[0_10px_30px_rgba(15,23,42,0.65)]">
                        <Image
                            src={ASSETS.logoWhite}
                            alt="TeamAction"
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                        />
                    </div>
                </div>
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white">
                        Login do Admininistrador
                    </h1>
                    <p className="text-sm text-slate-400 mt-2">
                        Acesso restrito ao{" "}
                        <span className="font-bold">Painel Administrativo</span>
                    </p>
                </div>
                {alert && (
                    <div className="mt-4 rounded-lg border border-rose-300/50 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
                        {alert}
                    </div>
                )}
                <form action={adminLoginAction} className="mt-6 space-y-4">
                    <div>
                        <label className="block text-sm text-slate-300 mb-1">
                            Senha de Administrador
                        </label>
                        <input
                            type="password"
                            name="password"
                            required
                            className="w-full rounded-lg border border-blue-200/20 bg-slate-900/70 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white shadow-lg shadow-blue-700/40 transition-all hover:-translate-y-0.5 hover:bg-blue-500"
                    >
                        Entrar
                    </button>
                </form>
            </div>
        </main>
    );
}
