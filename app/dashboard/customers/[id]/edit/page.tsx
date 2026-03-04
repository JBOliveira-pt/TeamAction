import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import EditCustomerForm from "@/app/ui/customers/edit-form";
import { fetchCustomerById } from "@/app/lib/data";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Editar Cliente | PrimeFlow Dashboard",
};

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const id = params.id;
    const isValidId =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            id,
        );

    if (!isValidId) {
        notFound();
    }

    const customer = await fetchCustomerById(id);

    if (!customer) {
        notFound();
    }

    return (
        <main>
            <Breadcrumbs
                breadcrumbs={[
                    { label: "Clientes", href: "/dashboard/customers" },
                    {
                        label: "Editar Cliente",
                        href: `/dashboard/customers/${id}/edit`,
                        active: true,
                    },
                ]}
            />
            <EditCustomerForm customer={customer} />
        </main>
    );
}
