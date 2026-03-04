import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import CreateUserForm from "@/app/ui/users/create-form";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Create User | PrimeFlow Dashboard",
};

export default function Page() {
    return (
        <main>
            <Breadcrumbs
                breadcrumbs={[
                    { label: "Users", href: "/dashboard/users" },
                    {
                        label: "Create User",
                        href: "/dashboard/users/create",
                        active: true,
                    },
                ]}
            />
            <CreateUserForm />
        </main>
    );
}
