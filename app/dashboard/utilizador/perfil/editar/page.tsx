import type { Atleta } from "@/app/lib/definitions";
import EditAtletaProfileForm from "@/app/ui/atleta/edit-profile-form";
import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function getAtletaByClerkUser(
    clerkUserId: string,
): Promise<Atleta | null> {
    const usersRows = await sql<
        {
            id: string;
            name: string | null;
            email: string;
            image_url: string | null;
            data_nascimento?: string | null;
            morada?: string | null;
            telefone?: string | null;
            peso_kg?: number | null;
            altura_cm?: number | null;
            nif?: string | null;
            status?: string | null;
            created_at?: string;
            updated_at?: string;
        }[]
    >`
        SELECT *
        FROM users
        WHERE clerk_user_id = ${clerkUserId}
        LIMIT 1
    `;

    const user = usersRows[0];
    if (!user) return null;

    const fullName = (user.name || "").trim();
    const [nome, ...rest] = fullName.length > 0 ? fullName.split(/\s+/) : [""];

    return {
        id: 0,
        nome: nome || "Usuário",
        sobrenome: rest.join(" "),
        data_nascimento: user.data_nascimento || "",
        morada: user.morada || null,
        telemovel: user.telefone || null,
        email: user.email,
        foto_perfil_url: user.image_url || null,
        peso_kg: user.peso_kg ?? null,
        altura_cm: user.altura_cm ?? null,
        nif: user.nif || "",
        estado:
            user.status === "inativo"
                ? "Inativo"
                : user.status === "pendente"
                  ? "Pendente"
                  : "Ativo",
        created_at: user.created_at || new Date().toISOString(),
        updated_at: user.updated_at || new Date().toISOString(),
    };
}

export default async function EditarPerfilUtilizadorPage() {
    const { userId } = await auth();
    if (!userId) redirect("/login");

    const atleta = await getAtletaByClerkUser(userId);
    if (!atleta) redirect("/dashboard/utilizador/perfil/criar");

    return (
        <main className="p-5 max-w-3xl mx-auto">
            <Breadcrumbs
                breadcrumbs={[
                    {
                        label: "Perfil do Usuário",
                        href: "/dashboard/utilizador/perfil",
                    },
                    {
                        label: "Editar Perfil",
                        href: "/dashboard/utilizador/perfil/editar",
                        active: true,
                    },
                ]}
            />
            <EditAtletaProfileForm atleta={atleta} />
        </main>
    );
}
