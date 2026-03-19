import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
    AccountType,
    getDashboardPathForAccountType,
    normalizeAccountType,
} from "@/app/lib/account-type";

export async function enforceDashboardAccountType(
    allowedAccountTypes: AccountType[],
): Promise<AccountType> {
    const { userId } = await auth();

    if (!userId) {
        redirect("/login");
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const accountType = normalizeAccountType(
        user.unsafeMetadata?.accountType ?? user.publicMetadata?.accountType,
    );

    if (!accountType) {
        redirect("/signup");
    }

    if (!allowedAccountTypes.includes(accountType)) {
        redirect(getDashboardPathForAccountType(accountType));
    }

    return accountType;
}
