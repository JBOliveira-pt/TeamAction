"use server";

import { uploadImageToR2, deleteImageFromR2 } from "./r2-storage";
import { auth } from "@clerk/nextjs/server";
import { canEditResource } from "./auth-helpers";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import postgres from "postgres";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcrypt";
import type { Customer, Invoice } from "./definitions";
import { createReceiptForPaidInvoice } from "./receipt-service";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

// Helper function to check admin permissions
async function checkAdminPermission() {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized: No session");
    }

    // Query database to check user role using Clerk ID
    const user = await sql`
        SELECT role FROM users WHERE clerk_user_id = ${userId}
    `;

    if (user.length === 0) {
        throw new Error("User not found in database");
    }

    if (user[0].role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
    }
}

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: "Please select a customer.",
    }),
    amount: z.coerce.number().gt(0, {
        message: "Please enter an amount greater than $0.",
    }),
    status: z.enum(["pending", "paid"], {
        invalid_type_error: "Please select an invoice status.",
    }),
    date: z.coerce.date({
        invalid_type_error: "Please select a valid date.",
        required_error: "Please select a date.",
    }),
    paymentDate: z.coerce
        .date({
            invalid_type_error: "Please select a valid payment date.",
        })
        .optional(),
    activityCode: z
        .string({
            invalid_type_error: "Please select an activity.",
        })
        .min(1, "Please select an activity."),
});

const CreateInvoice = FormSchema.omit({
    id: true,
    paymentDate: true,
    status: true,
});
const UpdateInvoice = FormSchema.omit({ id: true }).extend({
    activityCode: z.string().optional(),
});

export type State = {
    errors: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
        date?: string[];
        paymentDate?: string[];
        activityCode?: string[];
    };
    message: string | null;
};

const CustomerFormSchema = z.object({
    firstName: z
        .string()
        .trim()
        .min(1, { message: "Please enter a first name." }),
    lastName: z
        .string()
        .trim()
        .min(1, { message: "Please enter a last name." }),
    email: z.string().email({ message: "Please enter a valid email." }),
    nif: z
        .string()
        .trim()
        .regex(/^\d{9}$/, {
            message: "NIF deve ter exatamente 9 dígitos numéricos.",
        }),
    endereco_fiscal: z
        .string()
        .trim()
        .min(1, { message: "Por favor, insira o endereço fiscal." })
        .max(255, {
            message: "Endereço fiscal não pode exceder 255 caracteres.",
        }),
});

const CreateCustomer = CustomerFormSchema;
const UpdateCustomer = CustomerFormSchema;

export type CustomerState = {
    errors: {
        firstName?: string[];
        lastName?: string[];
        email?: string[];
        nif?: string[];
        endereco_fiscal?: string[];
        imageFile?: string[];
    };
    message: string | null;
};

// Maximum photo size: 5MB
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

const SignUpSchema = z.object({
    orgName: z.string().min(1, "Organization name is required"),
    adminName: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

async function persistPhotoToR2(
    file: File | null,
    entityType: "customer" | "user",
    entityId: string,
): Promise<string | null> {
    if (!file || file.size === 0) {
        return null;
    }

    if (file.size > MAX_PHOTO_SIZE) {
        throw new Error(
            `Photo size exceeds ${MAX_PHOTO_SIZE / 1024 / 1024}MB limit`,
        );
    }

    const tableName = entityType === "customer" ? "customers" : "users";

    let previousImageUrl: string | null = null;
    try {
        const previous = await sql<{ image_url: string | null }[]>`
            SELECT image_url FROM ${sql(tableName)} WHERE id = ${entityId}
        `;
        previousImageUrl = previous[0]?.image_url ?? null;
    } catch (error) {
        console.error("Failed to fetch previous image URL:", error);
    }

    // Upload to R2
    const imageUrl = await uploadImageToR2(file, entityType, entityId);

    // Update database with R2 URL
    await sql`
    UPDATE ${sql(tableName)}
    SET image_url = ${imageUrl}
    WHERE id = ${entityId}
  `;

    const r2PublicUrl = process.env.R2_PUBLIC_URL;
    if (
        previousImageUrl &&
        r2PublicUrl &&
        previousImageUrl.startsWith(r2PublicUrl)
    ) {
        try {
            await deleteImageFromR2(previousImageUrl);
        } catch (error) {
            console.error("Failed to delete previous image:", error);
        }
    }

    return imageUrl;
}

async function saveCustomerPhoto(
    file: File | null,
    customerId: string,
): Promise<string | null> {
    return persistPhotoToR2(file, "customer", customerId);
}

async function saveUserPhoto(
    file: File | null,
    userId: string,
): Promise<string | null> {
    return persistPhotoToR2(file, "user", userId);
}

// Authentication is now handled by Clerk
// Remove calls to this function and use Clerk's <SignInButton> instead
export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    // This function is deprecated with Clerk integration
    throw new Error(
        "Use Clerk's SignInButton instead of server-side authentication",
    );
}

export async function createInvoice(
    prevState: State,
    formData: FormData,
): Promise<State> {
    const { userId } = await auth();

    if (!userId) {
        return {
            errors: {},
            message: "Unauthorized",
        };
    }

    // Get user's database ID and organization_id from clerk_user_id
    let creatorId: string | undefined;
    let organizationId: string | undefined;
    try {
        const user = await sql<
            { id: string; organization_id: string }[]
        >`SELECT id, organization_id FROM users WHERE clerk_user_id = ${userId}`;
        creatorId = user[0]?.id;
        organizationId = user[0]?.organization_id;
    } catch (error) {
        console.error("Failed to fetch user:", error);
        return {
            errors: {},
            message: "Failed to fetch user information.",
        };
    }

    if (!creatorId) {
        return {
            errors: {},
            message: "User not found in database.",
        };
    }

    if (!organizationId) {
        return {
            errors: {},
            message: "User not found or no organization assigned.",
        };
    }

    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get("customerId"),
        amount: formData.get("amount"),
        date: formData.get("date"),
        activityCode: formData.get("activityCode"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing Fields. Failed to Create Invoice.",
        };
    }

    const { customerId, amount, date, activityCode } = validatedFields.data;
    const amountInCents = Math.round(amount * 100);
    const formattedDate = date.toISOString().split("T")[0];

    let invoiceId: string | undefined;
    try {
        const inserted = await sql<{ id: string }[]>`
            INSERT INTO invoices (customer_id, amount, status, date, created_by, organization_id, activity_code)
            VALUES (${customerId}, ${amountInCents}, 'pending', ${formattedDate}, ${creatorId}, ${organizationId}, ${activityCode})
            RETURNING id
        `;
        invoiceId = inserted[0]?.id;
    } catch (error) {
        console.error(error);
        return {
            errors: {},
            message: "Database Error: Failed to Create Invoice.",
        };
    }

    revalidatePath("/dashboard/invoices");
    redirect("/dashboard/invoices");
}

export async function updateInvoice(
    id: string,
    prevState: State,
    formData: FormData,
): Promise<State> {
    const { userId } = await auth();

    if (!userId) {
        return {
            errors: {},
            message: "Unauthorized",
        };
    }

    // Get user's organization_id
    let organizationId: string | undefined;
    try {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${userId}`;
        organizationId = user[0]?.organization_id;
    } catch (error) {
        console.error("Failed to fetch user organization:", error);
        return {
            errors: {},
            message: "Failed to fetch user organization.",
        };
    }

    if (!organizationId) {
        return {
            errors: {},
            message: "User not found or no organization assigned.",
        };
    }

    // Fetch invoice to check permissions and organization
    let invoice: (Invoice & { created_by?: string }) | undefined;
    try {
        const data = await sql<
            (Invoice & { created_by?: string })[]
        >`SELECT * FROM invoices WHERE id = ${id} AND organization_id = ${organizationId}`;
        invoice = data[0];
    } catch (error) {
        return {
            errors: {},
            message: "Invoice not found.",
        };
    }

    if (!invoice) {
        return {
            errors: {},
            message: "Invoice not found.",
        };
    }

    // Check if user can edit this invoice
    const canEdit = await canEditResource(invoice.created_by);
    if (!canEdit) {
        return {
            errors: {},
            message: "Unauthorized: You can only edit invoices you created.",
        };
    }

    // Prevent editing paid invoices
    if (invoice.status === "paid") {
        return {
            errors: {},
            message: "Cannot edit paid invoices.",
        };
    }

    const validatedFields = UpdateInvoice.safeParse({
        customerId: formData.get("customerId"),
        amount: formData.get("amount"),
        status: formData.get("status"),
        date: formData.get("date"),
        paymentDate: formData.get("paymentDate") || undefined,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing Fields. Failed to Update Invoice.",
        };
    }

    const { customerId, amount, status, date, paymentDate } =
        validatedFields.data;

    // Validate payment date range if provided
    if (paymentDate) {
        const launchDate = new Date(date);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today

        if (paymentDate < launchDate || paymentDate > today) {
            return {
                errors: {
                    paymentDate: [
                        "Payment date must be between launch date and today.",
                    ],
                },
                message: "Invalid payment date.",
            };
        }
    }

    const shouldCreateReceipt =
        invoice.status === "pending" && status === "paid";

    console.log("🔍 shouldCreateReceipt evaluation:", {
        condition: `invoice.status === "pending" && status === "paid"`,
        "invoice.status": invoice.status,
        status: status,
        shouldCreateReceipt,
    });

    const amountInCents = Math.round(amount * 100); // Converter euros para centavos
    const formattedDate = date.toISOString().split("T")[0];
    const formattedPaymentDate = paymentDate
        ? paymentDate.toISOString().split("T")[0]
        : null;

    console.log("🔧 UPDATE Values:", {
        customerId,
        amountInCents,
        status,
        formattedDate,
        formattedPaymentDate,
        invoiceId: id,
    });

    try {
        const result = await sql`
            UPDATE invoices
            SET customer_id = ${customerId}, 
                amount = ${amountInCents}, 
                status = ${status}, 
                date = ${formattedDate},
                payment_date = ${formattedPaymentDate}
            WHERE id = ${id}
        `;

        console.log("✅ UPDATE Result:", result);
    } catch (error) {
        console.error("❌ UPDATE Error:", error);
        return {
            errors: {},
            message: "Database Error: Failed to Update Invoice.",
        };
    }

    if (shouldCreateReceipt) {
        try {
            await createReceiptForPaidInvoice(id);
        } catch (error) {
            console.error("Receipt creation failed:", error);
            return {
                errors: {},
                message:
                    "Invoice updated, but failed to generate receipt. Please check IBAN and try again.",
            };
        }
    }

    revalidatePath("/dashboard/invoices");
    redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    // Get user's organization_id
    let organizationId: string | undefined;
    try {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${userId}`;
        organizationId = user[0]?.organization_id;
    } catch (error) {
        console.error("Failed to fetch user organization:", error);
        throw new Error("Failed to fetch user organization.");
    }

    if (!organizationId) {
        throw new Error("User not found or no organization assigned.");
    }

    // Fetch invoice to check permissions and organization
    let invoice: (Invoice & { created_by?: string }) | undefined;
    try {
        const data = await sql<
            (Invoice & { created_by?: string })[]
        >`SELECT * FROM invoices WHERE id = ${id} AND organization_id = ${organizationId}`;
        invoice = data[0];
    } catch (error) {
        throw new Error("Invoice not found.");
    }

    if (!invoice) {
        throw new Error("Invoice not found.");
    }

    // Check if user can delete this invoice
    const canDelete = await canEditResource(invoice.created_by);
    if (!canDelete) {
        throw new Error(
            "Unauthorized: You can only delete invoices you created.",
        );
    }

    // Prevent deleting paid invoices
    if (invoice.status === "paid") {
        throw new Error("Cannot delete paid invoices.");
    }

    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;
    } catch (error) {
        throw new Error("Database Error: Failed to delete invoice.");
    }

    revalidatePath("/dashboard/invoices");
}

export async function createCustomer(
    prevState: CustomerState,
    formData: FormData,
): Promise<CustomerState> {
    const { userId } = await auth();

    if (!userId) {
        return {
            errors: {},
            message: "Unauthorized",
        };
    }

    // Fetch organization_id from database using userId
    let organizationId: string | undefined;
    let creatorId: string | undefined;
    try {
        const user = await sql<
            { organization_id: string; id: string }[]
        >`SELECT organization_id, id FROM users WHERE clerk_user_id = ${userId}`;
        organizationId = user[0]?.organization_id;
        creatorId = user[0]?.id;
    } catch (error) {
        console.error("Failed to fetch user organization:", error);
        return {
            errors: {},
            message: "Failed to retrieve user organization.",
        };
    }

    if (!organizationId) {
        return {
            errors: {},
            message: "User not found or no organization assigned.",
        };
    }

    if (!creatorId) {
        return {
            errors: {},
            message: "User not found in database.",
        };
    }

    const validatedFields = CreateCustomer.safeParse({
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        nif: formData.get("nif"),
        endereco_fiscal: formData.get("endereco_fiscal"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing or invalid fields. Failed to create customer.",
        };
    }

    const imageFile = formData.get("imageFile");
    if (!(imageFile instanceof File) || imageFile.size === 0) {
        return {
            errors: {},
            message: "Please upload a customer photo.",
        };
    }

    const { firstName, lastName, email, nif, endereco_fiscal } =
        validatedFields.data;
    const fullName = `${firstName} ${lastName}`.trim().replace(/\s+/g, " ");

    let customerId: string;
    try {
        const result = await sql`
            INSERT INTO customers (id, name, email, nif, endereco_fiscal, organization_id, created_by)
            VALUES (gen_random_uuid(), ${fullName}, ${email}, ${nif}, ${endereco_fiscal}, ${organizationId}, ${creatorId})
            RETURNING id
        `;
        customerId = result[0].id;
    } catch (error) {
        console.error(error);
        return {
            errors: {},
            message: "Database Error: Failed to create customer.",
        };
    }

    try {
        await saveCustomerPhoto(imageFile, customerId);
    } catch (error) {
        console.error(error);
        return {
            errors: {},
            message: `Failed to upload photo: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
    }

    revalidatePath("/dashboard/customers");
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/(overview)");
    redirect("/dashboard/customers");
}

export async function updateCustomer(
    id: string,
    prevState: CustomerState,
    formData: FormData,
): Promise<CustomerState> {
    const { userId } = await auth();

    if (!userId) {
        return {
            errors: {},
            message: "Unauthorized",
        };
    }

    // Get user's organization_id
    let organizationId: string | undefined;
    try {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${userId}`;
        organizationId = user[0]?.organization_id;
    } catch (error) {
        console.error("Failed to fetch user organization:", error);
        return {
            errors: {},
            message: "Failed to fetch user organization.",
        };
    }

    if (!organizationId) {
        return {
            errors: {},
            message: "User not found or no organization assigned.",
        };
    }

    // Fetch customer to check permissions and organization
    let customer: Customer | undefined;
    try {
        const data = await sql<
            Customer[]
        >`SELECT * FROM customers WHERE id = ${id} AND organization_id = ${organizationId}`;
        customer = data[0];
    } catch (error) {
        return {
            errors: {},
            message: "Customer not found.",
        };
    }

    if (!customer) {
        return {
            errors: {},
            message: "Customer not found.",
        };
    }

    // Check if user can edit this customer
    const canEdit = await canEditResource(customer.created_by);
    if (!canEdit) {
        return {
            errors: {},
            message: "Unauthorized: You can only edit customers you created.",
        };
    }

    const validatedFields = UpdateCustomer.safeParse({
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        nif: formData.get("nif"),
        endereco_fiscal: formData.get("endereco_fiscal"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing or invalid fields. Failed to update customer.",
        };
    }

    const imageFile = formData.get("imageFile");
    if (!(imageFile instanceof File) || imageFile.size === 0) {
        return {
            errors: {},
            message: "Please upload a new customer photo.",
        };
    }

    const { firstName, lastName, email, nif, endereco_fiscal } =
        validatedFields.data;
    const fullName = `${firstName} ${lastName}`.trim().replace(/\s+/g, " ");

    try {
        await sql`
            UPDATE customers
            SET name = ${fullName}, email = ${email}, nif = ${nif}, endereco_fiscal = ${endereco_fiscal}
            WHERE id = ${id}
        `;
    } catch (error) {
        console.error(error);
        return {
            errors: {},
            message: "Database Error: Failed to update customer.",
        };
    }

    try {
        await saveCustomerPhoto(imageFile, id);
    } catch (error) {
        console.error(error);
        return {
            errors: {},
            message: `Failed to upload photo: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
    }

    revalidatePath("/dashboard/customers");
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/(overview)");
    redirect("/dashboard/customers");
}

export async function deleteCustomer(id: string) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    // Get user's organization_id
    let organizationId: string | undefined;
    try {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${userId}`;
        organizationId = user[0]?.organization_id;
    } catch (error) {
        console.error("Failed to fetch user organization:", error);
        throw new Error("Failed to fetch user organization.");
    }

    if (!organizationId) {
        throw new Error("User not found or no organization assigned.");
    }

    // Fetch customer to check permissions and organization
    let customer: Customer | undefined;
    try {
        const data = await sql<
            Customer[]
        >`SELECT * FROM customers WHERE id = ${id} AND organization_id = ${organizationId}`;
        customer = data[0];
    } catch (error) {
        throw new Error("Customer not found.");
    }

    if (!customer) {
        throw new Error("Customer not found.");
    }

    // Check if user can delete this customer
    const canDelete = await canEditResource(customer.created_by);
    if (!canDelete) {
        throw new Error(
            "Unauthorized: You can only delete customers you created.",
        );
    }

    try {
        await sql`DELETE FROM customers WHERE id = ${id}`;
    } catch (error) {
        console.error(error);
        throw new Error(
            "Database Error: Failed to delete customer. Remove related invoices first.",
        );
    }

    revalidatePath("/dashboard/customers");
    revalidatePath("/dashboard/invoices");
    revalidatePath("/dashboard/(overview)");
}

const UserFormSchema = z.object({
    firstName: z
        .string()
        .trim()
        .min(1, { message: "Please enter a first name." }),
    lastName: z
        .string()
        .trim()
        .min(1, { message: "Please enter a last name." }),
    email: z.string().email({ message: "Please enter a valid email." }),
    iban: z
        .string()
        .trim()
        .regex(/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/, {
            message: "Please enter a valid IBAN.",
        })
        .optional()
        .or(z.literal("")),
    password: z
        .string()
        .min(6, { message: "Password must be at least 6 characters." })
        .optional()
        .or(z.literal("")),
    role: z
        .enum(["admin", "user"], {
            invalid_type_error: "Please select a valid role.",
        })
        .default("user"),
});

const CreateUser = UserFormSchema.extend({
    password: z
        .string()
        .min(6, { message: "Password must be at least 6 characters." }),
});

const UpdateUser = UserFormSchema.omit({ role: true });

export type UserState = {
    errors: {
        firstName?: string[];
        lastName?: string[];
        email?: string[];
        iban?: string[];
        password?: string[];
        role?: string[];
        imageFile?: string[];
    };
    message: string | null;
};

export async function createUser(
    prevState: UserState,
    formData: FormData,
): Promise<UserState> {
    try {
        await checkAdminPermission();
    } catch (error) {
        return {
            errors: {},
            message: "Unauthorized: Only admins can create users.",
        };
    }

    const validatedFields = CreateUser.safeParse({
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        iban: formData.get("iban"),
        password: formData.get("password"),
        role: formData.get("role"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing or invalid fields. Failed to create user.",
        };
    }

    const imageFile = formData.get("imageFile");
    const { firstName, lastName, email, iban, password, role } =
        validatedFields.data;

    // IBAN é obrigatório para admins
    if (role === "admin" && (!iban || iban.length === 0)) {
        return {
            errors: { iban: ["IBAN is required for admin users."] },
            message: "IBAN is required for admin users.",
        };
    }

    const fullName = `${firstName} ${lastName}`.trim().replace(/\s+/g, " ");

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in Clerk first
    let clerkUserId: string;
    try {
        const clerkResponse = await fetch("https://api.clerk.com/v1/users", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email_address: [email],
                first_name: firstName,
                last_name: lastName,
                password: password,
                public_metadata: {
                    role: role,
                },
            }),
        });

        if (!clerkResponse.ok) {
            const errorData = await clerkResponse.json();
            console.error("Clerk API Error:", errorData);
            return {
                errors: {},
                message: `Failed to create user in Clerk: ${errorData.errors?.[0]?.message || "Unknown error"}`,
            };
        }

        const clerkUser = await clerkResponse.json();
        clerkUserId = clerkUser.id;
    } catch (error) {
        console.error("Clerk API Error:", error);
        return {
            errors: {},
            message: "Failed to create user authentication account.",
        };
    }

    // Get organization_id from current admin
    const { userId: adminClerkId } = await auth();
    let organizationId: string | undefined;
    try {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${adminClerkId}`;
        organizationId = user[0]?.organization_id;
    } catch (error) {
        console.error("Failed to fetch admin organization:", error);
        return {
            errors: {},
            message: "Failed to fetch admin organization.",
        };
    }

    if (!organizationId) {
        return {
            errors: {},
            message: "Admin not found or no organization assigned.",
        };
    }

    // Now create user in database with clerk_user_id
    let userId: string;
    try {
        const normalizedIban = iban ? iban.replace(/\s+/g, "") : null;
        const result = await sql`
            INSERT INTO users (id, name, email, password, role, clerk_user_id, organization_id, iban)
            VALUES (gen_random_uuid(), ${fullName}, ${email}, ${hashedPassword}, ${role}, ${clerkUserId}, ${organizationId}, ${normalizedIban})
            RETURNING id
        `;
        userId = result[0].id;
    } catch (error) {
        console.error(error);
        // Rollback: delete Clerk user if DB insert fails
        try {
            await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
                },
            });
        } catch (rollbackError) {
            console.error("Failed to rollback Clerk user:", rollbackError);
        }
        return {
            errors: {},
            message: "Database Error: Failed to create user.",
        };
    }

    if (imageFile instanceof File && imageFile.size > 0) {
        try {
            await saveUserPhoto(imageFile, userId);
        } catch (error) {
            console.error(error);
            return {
                errors: {},
                message: `Failed to upload photo: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    revalidatePath("/dashboard/users");
    redirect("/dashboard/users");
}

export async function updateUser(
    id: string,
    prevState: UserState,
    formData: FormData,
): Promise<UserState> {
    try {
        await checkAdminPermission();
    } catch (error) {
        return {
            errors: {},
            message: "Unauthorized: Only admins can update users.",
        };
    }

    // Get current admin's organization_id
    const { userId: adminClerkId } = await auth();
    let organizationId: string | undefined;
    try {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${adminClerkId}`;
        organizationId = user[0]?.organization_id;
    } catch (error) {
        console.error("Failed to fetch admin organization:", error);
        return {
            errors: {},
            message: "Failed to fetch admin organization.",
        };
    }

    if (!organizationId) {
        return {
            errors: {},
            message: "Admin not found or no organization assigned.",
        };
    }

    // Verify that user belongs to admin's organization
    try {
        const userCheck = await sql<
            { id: string; role: string }[]
        >`SELECT id, role FROM users WHERE id = ${id} AND organization_id = ${organizationId}`;
        if (userCheck.length === 0) {
            return {
                errors: {},
                message:
                    "User not found or does not belong to your organization.",
            };
        }

        // Se estiver atualizando um admin, IBAN é obrigatório
        const userRole = userCheck[0].role;
        const iban = formData.get("iban");
        if (
            userRole === "admin" &&
            (!iban || (typeof iban === "string" && iban.trim().length === 0))
        ) {
            return {
                errors: { iban: ["IBAN is required for admin users."] },
                message: "IBAN is required for admin users.",
            };
        }
    } catch (error) {
        return {
            errors: {},
            message: "Failed to verify user organization.",
        };
    }

    const validatedFields = UpdateUser.safeParse({
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        iban: formData.get("iban"),
        password: formData.get("password"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing or invalid fields. Failed to update user.",
        };
    }

    const { firstName, lastName, email, iban, password } = validatedFields.data;
    const fullName = `${firstName} ${lastName}`.trim().replace(/\s+/g, " ");
    const normalizedIban = iban ? iban.replace(/\s+/g, "") : null;

    try {
        if (password && password.length >= 6) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await sql`
                UPDATE users
                SET name = ${fullName}, email = ${email}, iban = ${normalizedIban}, password = ${hashedPassword}
                WHERE id = ${id}
            `;
        } else {
            await sql`
                UPDATE users
                SET name = ${fullName}, email = ${email}, iban = ${normalizedIban}
                WHERE id = ${id}
            `;
        }
    } catch (error) {
        console.error(error);
        return {
            errors: {},
            message: "Database Error: Failed to update user.",
        };
    }

    const imageFile = formData.get("imageFile");
    if (imageFile instanceof File && imageFile.size > 0) {
        try {
            await saveUserPhoto(imageFile, id);
        } catch (error) {
            console.error(error);
            return {
                errors: {},
                message: `Failed to upload photo: ${error instanceof Error ? error.message : "Unknown error"}`,
            };
        }
    }

    revalidatePath("/dashboard/users");
    redirect("/dashboard/users");
}

export async function deleteUser(id: string) {
    try {
        await checkAdminPermission();
    } catch (error) {
        throw new Error("Unauthorized: Only admins can delete users.");
    }

    // Get current admin's organization_id
    const { userId: adminClerkId } = await auth();
    let organizationId: string | undefined;
    try {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${adminClerkId}`;
        organizationId = user[0]?.organization_id;
    } catch (error) {
        console.error("Failed to fetch admin organization:", error);
        throw new Error("Failed to fetch admin organization.");
    }

    if (!organizationId) {
        throw new Error("Admin not found or no organization assigned.");
    }

    // Verify that user belongs to admin's organization
    try {
        const userCheck = await sql<
            { id: string }[]
        >`SELECT id FROM users WHERE id = ${id} AND organization_id = ${organizationId}`;
        if (userCheck.length === 0) {
            throw new Error(
                "User not found or does not belong to your organization.",
            );
        }
    } catch (error) {
        throw new Error("Failed to verify user organization.");
    }

    try {
        await sql`DELETE FROM users WHERE id = ${id}`;
    } catch (error) {
        console.error(error);
        throw new Error("Database Error: Failed to delete user.");
    }

    revalidatePath("/dashboard/users");
}

export async function createOrganizationAndAdmin(formData: FormData) {
    const validatedFields = SignUpSchema.safeParse({
        orgName: formData.get("orgName"),
        adminName: formData.get("adminName"),
        email: formData.get("email"),
        password: formData.get("password"),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Invalid input",
        };
    }

    const { orgName, adminName, email, password } = validatedFields.data;

    try {
        // 1. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Create organization
        const orgSlug = orgName.toLowerCase().replace(/\s+/g, "-");

        const orgResult = await sql`
            INSERT INTO organizations (name, slug)
            VALUES (${orgName}, ${orgSlug})
            RETURNING id
        `;

        const organizationId = orgResult[0].id;

        // 3. Create admin user
        const userResult = await sql`
            INSERT INTO users (name, email, password, role, organization_id)
            VALUES (${adminName}, ${email}, ${hashedPassword}, 'admin', ${organizationId})
            RETURNING id
        `;

        const userId = userResult[0].id;

        // 4. Update organization with owner_id
        await sql`
            UPDATE organizations
            SET owner_id = ${userId}
            WHERE id = ${organizationId}
        `;

        return {
            success: true,
            message: "Organization created successfully!",
        };
    } catch (error: any) {
        if (error.code === "23505") {
            // Unique violation
            return {
                success: false,
                message: "Email or organization name already exists",
            };
        }

        console.error("SignUp error:", error);
        return {
            success: false,
            message: "Failed to create organization",
        };
    }
}
