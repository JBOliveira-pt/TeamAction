"use client";

import {
    UserGroupIcon,
    HomeIcon,
    DocumentDuplicateIcon,
    ReceiptRefundIcon,
    UsersIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

// Map of links to display in the side navigation.
// Depending on the size of the application, this would be stored in a database.
const links = [
    { name: "Home", href: "/dashboard", icon: HomeIcon },
    {
        name: "Invoices",
        href: "/dashboard/invoices",
        icon: DocumentDuplicateIcon,
    },
    {
        name: "Receipts",
        href: "/dashboard/receipts",
        icon: ReceiptRefundIcon,
    },
    { name: "Customers", href: "/dashboard/customers", icon: UserGroupIcon },
    { name: "Users", href: "/dashboard/users", icon: UsersIcon },
];

export default function NavLinks() {
    const pathname = usePathname();
    return (
        <>
            {links.map((link) => {
                const LinkIcon = link.icon;
                return (
                    <Link
                        key={link.name}
                        href={link.href}
                        className={clsx(
                            "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group",
                            pathname === link.href
                                ? "bg-blue-600/10 text-blue-400 border-r-2 border-blue-500"
                                : "text-gray-400 hover:bg-gray-900 hover:text-gray-100",
                        )}
                    >
                        <LinkIcon
                            className={clsx(
                                "w-5 h-5 transition-colors",
                                pathname === link.href
                                    ? "text-blue-400"
                                    : "text-gray-500 group-hover:text-white",
                            )}
                        />{" "}
                        <p className="font-medium">{link.name}</p>
                    </Link>
                );
            })}
        </>
    );
}
