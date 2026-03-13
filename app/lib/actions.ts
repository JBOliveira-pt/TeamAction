'use server';

import { auth } from '@clerk/nextjs/server';
import { canEditResource } from './auth-helpers';
import {
    deleteImageFromR2,
    uploadAtletaPhotoToR2,
    uploadImageToR2,
} from './r2-storage';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';
import { z } from 'zod';
import type { AtletaState, Customer, Invoice } from './definitions';
import { createReceiptForPaidInvoice } from './receipt-service';
import { getOrganizationId } from "@/app/lib/data";


const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// Helper function to check admin permissions
async function checkAdminPermission() {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('Unauthorized: No session');
    }

    // Query database to check user role using Clerk ID
    const user = await sql`
        SELECT role FROM users WHERE clerk_user_id = ${userId}
    `;

    if (user.length === 0) {
        throw new Error('User not found in database');
    }

    if (user[0].role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
    }
}

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer.',
    }),
    amount: z.coerce.number().gt(0, {
        message: 'Please enter an amount greater than $0.',
    }),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status.',
    }),
    date: z.coerce.date({
        invalid_type_error: 'Please select a valid date.',
        required_error: 'Please select a date.',
    }),
    paymentDate: z.coerce
        .date({
            invalid_type_error: 'Please select a valid payment date.',
        })
        .optional(),
    activityCode: z
        .string({
            invalid_type_error: 'Please select an activity.',
        })
        .min(1, 'Please select an activity.'),
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
        .min(1, { message: 'Please enter a first name.' }),
    lastName: z
        .string()
        .trim()
        .min(1, { message: 'Please enter a last name.' }),
    email: z.string().email({ message: 'Please enter a valid email.' }),
    nif: z
        .string()
        .trim()
        .regex(/^\d{9}$/, {
            message: 'NIF deve ter exatamente 9 dígitos numéricos.',
        }),
    endereco_fiscal: z
        .string()
        .trim()
        .min(1, { message: 'Por favor, insira o endereço fiscal.' })
        .max(255, {
            message: 'Endereço fiscal não pode exceder 255 caracteres.',
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
    orgName: z.string().min(1, 'Organization name is required'),
    adminName: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

async function persistPhotoToR2(
    file: File | null,
    entityType: 'customer' | 'user',
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

    const tableName = entityType === 'customer' ? 'customers' : 'users';

    let previousImageUrl: string | null = null;
    try {
        const previous = await sql<{ image_url: string | null }[]>`
            SELECT image_url FROM ${sql(tableName)} WHERE id = ${entityId}
        `;
        previousImageUrl = previous[0]?.image_url ?? null;
    } catch (error) {
        console.error('Failed to fetch previous image URL:', error);
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
            console.error('Failed to delete previous image:', error);
        }
    }

    return imageUrl;
}

async function saveCustomerPhoto(
    file: File | null,
    customerId: string,
): Promise<string | null> {
    return persistPhotoToR2(file, 'customer', customerId);
}

async function saveUserPhoto(
    file: File | null,
    userId: string,
): Promise<string | null> {
    return persistPhotoToR2(file, 'user', userId);
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
            message: 'Unauthorized',
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
        console.error('Failed to fetch user:', error);
        return {
            errors: {},
            message: 'Failed to fetch user information.',
        };
    }

    if (!creatorId) {
        return {
            errors: {},
            message: 'User not found in database.',
        };
    }

    if (!organizationId) {
        return {
            errors: {},
            message: 'User not found or no organization assigned.',
        };
    }

    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        date: formData.get('date'),
        activityCode: formData.get('activityCode'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    }

    const { customerId, amount, date, activityCode } = validatedFields.data;
    const amountInCents = Math.round(amount * 100);
    const formattedDate = date.toISOString().split('T')[0];

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
            message: 'Database Error: Failed to Create Invoice.',
        };
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
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
            message: 'Unauthorized',
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
        console.error('Failed to fetch user organization:', error);
        return {
            errors: {},
            message: 'Failed to fetch user organization.',
        };
    }

    if (!organizationId) {
        return {
            errors: {},
            message: 'User not found or no organization assigned.',
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
            message: 'Invoice not found.',
        };
    }

    if (!invoice) {
        return {
            errors: {},
            message: 'Invoice not found.',
        };
    }

    // Check if user can edit this invoice
    const canEdit = await canEditResource(invoice.created_by);
    if (!canEdit) {
        return {
            errors: {},
            message: 'Unauthorized: You can only edit invoices you created.',
        };
    }

    // Prevent editing paid invoices
    if (invoice.status === 'paid') {
        return {
            errors: {},
            message: 'Cannot edit paid invoices.',
        };
    }

    const validatedFields = UpdateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
        date: formData.get('date'),
        paymentDate: formData.get('paymentDate') || undefined,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Update Invoice.',
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
                        'Payment date must be between launch date and today.',
                    ],
                },
                message: 'Invalid payment date.',
            };
        }
    }

    const shouldCreateReceipt =
        invoice.status === 'pending' && status === 'paid';

    console.log('🔍 shouldCreateReceipt evaluation:', {
        condition: `invoice.status === "pending" && status === "paid"`,
        'invoice.status': invoice.status,
        status: status,
        shouldCreateReceipt,
    });

    const amountInCents = Math.round(amount * 100); // Converter euros para centavos
    const formattedDate = date.toISOString().split('T')[0];
    const formattedPaymentDate = paymentDate
        ? paymentDate.toISOString().split('T')[0]
        : null;

    console.log('🔧 UPDATE Values:', {
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

        console.log('✅ UPDATE Result:', result);
    } catch (error) {
        console.error('❌ UPDATE Error:', error);
        return {
            errors: {},
            message: 'Database Error: Failed to Update Invoice.',
        };
    }

    if (shouldCreateReceipt) {
        try {
            await createReceiptForPaidInvoice(id);
        } catch (error) {
            console.error('Receipt creation failed:', error);
            return {
                errors: {},
                message:
                    'Invoice updated, but failed to generate receipt. Please check IBAN and try again.',
            };
        }
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('Unauthorized');
    }

    // Get user's organization_id
    let organizationId: string | undefined;
    try {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${userId}`;
        organizationId = user[0]?.organization_id;
    } catch (error) {
        console.error('Failed to fetch user organization:', error);
        throw new Error('Failed to fetch user organization.');
    }

    if (!organizationId) {
        throw new Error('User not found or no organization assigned.');
    }

    // Fetch invoice to check permissions and organization
    let invoice: (Invoice & { created_by?: string }) | undefined;
    try {
        const data = await sql<
            (Invoice & { created_by?: string })[]
        >`SELECT * FROM invoices WHERE id = ${id} AND organization_id = ${organizationId}`;
        invoice = data[0];
    } catch (error) {
        throw new Error('Invoice not found.');
    }

    if (!invoice) {
        throw new Error('Invoice not found.');
    }

    // Check if user can delete this invoice
    const canDelete = await canEditResource(invoice.created_by);
    if (!canDelete) {
        throw new Error(
            'Unauthorized: You can only delete invoices you created.',
        );
    }

    // Prevent deleting paid invoices
    if (invoice.status === 'paid') {
        throw new Error('Cannot delete paid invoices.');
    }

    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;
    } catch (error) {
        throw new Error('Database Error: Failed to delete invoice.');
    }

    revalidatePath('/dashboard/invoices');
}

export async function createCustomer(
    prevState: CustomerState,
    formData: FormData,
): Promise<CustomerState> {
    const { userId } = await auth();

    if (!userId) {
        return {
            errors: {},
            message: 'Unauthorized',
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
        console.error('Failed to fetch user organization:', error);
        return {
            errors: {},
            message: 'Failed to retrieve user organization.',
        };
    }

    if (!organizationId) {
        return {
            errors: {},
            message: 'User not found or no organization assigned.',
        };
    }

    if (!creatorId) {
        return {
            errors: {},
            message: 'User not found in database.',
        };
    }

    const validatedFields = CreateCustomer.safeParse({
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        nif: formData.get('nif'),
        endereco_fiscal: formData.get('endereco_fiscal'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing or invalid fields. Failed to create customer.',
        };
    }

    const imageFile = formData.get('imageFile');
    if (!(imageFile instanceof File) || imageFile.size === 0) {
        return {
            errors: {},
            message: 'Please upload a customer photo.',
        };
    }

    const { firstName, lastName, email, nif, endereco_fiscal } =
        validatedFields.data;
    const fullName = `${firstName} ${lastName}`.trim().replace(/\s+/g, ' ');

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
            message: 'Database Error: Failed to create customer.',
        };
    }

    try {
        await saveCustomerPhoto(imageFile, customerId);
    } catch (error) {
        console.error(error);
        return {
            errors: {},
            message: `Failed to upload photo: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }

    revalidatePath('/dashboard/customers');
    revalidatePath('/dashboard/invoices');
    revalidatePath('/dashboard/(overview)');
    redirect('/dashboard/customers');
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
            message: 'Unauthorized',
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
        console.error('Failed to fetch user organization:', error);
        return {
            errors: {},
            message: 'Failed to fetch user organization.',
        };
    }

    if (!organizationId) {
        return {
            errors: {},
            message: 'User not found or no organization assigned.',
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
            message: 'Customer not found.',
        };
    }

    if (!customer) {
        return {
            errors: {},
            message: 'Customer not found.',
        };
    }

    // Check if user can edit this customer
    const canEdit = await canEditResource(customer.created_by);
    if (!canEdit) {
        return {
            errors: {},
            message: 'Unauthorized: You can only edit customers you created.',
        };
    }

    const validatedFields = UpdateCustomer.safeParse({
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        nif: formData.get('nif'),
        endereco_fiscal: formData.get('endereco_fiscal'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing or invalid fields. Failed to update customer.',
        };
    }

    const imageFile = formData.get('imageFile');
    if (!(imageFile instanceof File) || imageFile.size === 0) {
        return {
            errors: {},
            message: 'Please upload a new customer photo.',
        };
    }

    const { firstName, lastName, email, nif, endereco_fiscal } =
        validatedFields.data;
    const fullName = `${firstName} ${lastName}`.trim().replace(/\s+/g, ' ');

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
            message: 'Database Error: Failed to update customer.',
        };
    }

    try {
        await saveCustomerPhoto(imageFile, id);
    } catch (error) {
        console.error(error);
        return {
            errors: {},
            message: `Failed to upload photo: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }

    revalidatePath('/dashboard/customers');
    revalidatePath('/dashboard/invoices');
    revalidatePath('/dashboard/(overview)');
    redirect('/dashboard/customers');
}

export async function deleteCustomer(id: string) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('Unauthorized');
    }

    // Get user's organization_id
    let organizationId: string | undefined;
    try {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${userId}`;
        organizationId = user[0]?.organization_id;
    } catch (error) {
        console.error('Failed to fetch user organization:', error);
        throw new Error('Failed to fetch user organization.');
    }

    if (!organizationId) {
        throw new Error('User not found or no organization assigned.');
    }

    // Fetch customer to check permissions and organization
    let customer: Customer | undefined;
    try {
        const data = await sql<
            Customer[]
        >`SELECT * FROM customers WHERE id = ${id} AND organization_id = ${organizationId}`;
        customer = data[0];
    } catch (error) {
        throw new Error('Customer not found.');
    }

    if (!customer) {
        throw new Error('Customer not found.');
    }

    // Check if user can delete this customer
    const canDelete = await canEditResource(customer.created_by);
    if (!canDelete) {
        throw new Error(
            'Unauthorized: You can only delete customers you created.',
        );
    }

    try {
        await sql`DELETE FROM customers WHERE id = ${id}`;
    } catch (error) {
        console.error(error);
        throw new Error(
            'Database Error: Failed to delete customer. Remove related invoices first.',
        );
    }

    revalidatePath('/dashboard/customers');
    revalidatePath('/dashboard/invoices');
    revalidatePath('/dashboard/(overview)');
}

const UserFormSchema = z.object({
    firstName: z
        .string()
        .trim()
        .min(1, { message: 'Please enter a first name.' }),
    lastName: z
        .string()
        .trim()
        .min(1, { message: 'Please enter a last name.' }),
    email: z.string().email({ message: 'Please enter a valid email.' }),
    iban: z
        .string()
        .trim()
        .regex(/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/, {
            message: 'Please enter a valid IBAN.',
        })
        .optional()
        .or(z.literal('')),
    password: z
        .string()
        .min(6, { message: 'Password must be at least 6 characters.' })
        .optional()
        .or(z.literal('')),
    role: z
        .enum(['admin', 'user'], {
            invalid_type_error: 'Please select a valid role.',
        })
        .default('user'),
});

const CreateUser = UserFormSchema.extend({
    password: z
        .string()
        .min(6, { message: 'Password must be at least 6 characters.' }),
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
            message: 'Unauthorized: Only admins can create users.',
        };
    }

    const validatedFields = CreateUser.safeParse({
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        iban: formData.get('iban'),
        password: formData.get('password'),
        role: formData.get('role'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing or invalid fields. Failed to create user.',
        };
    }

    const imageFile = formData.get('imageFile');
    const { firstName, lastName, email, iban, password, role } =
        validatedFields.data;

    // IBAN é obrigatório para admins
    if (role === 'admin' && (!iban || iban.length === 0)) {
        return {
            errors: { iban: ['IBAN is required for admin users.'] },
            message: 'IBAN is required for admin users.',
        };
    }

    const fullName = `${firstName} ${lastName}`.trim().replace(/\s+/g, ' ');

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in Clerk first
    let clerkUserId: string;
    try {
        const clerkResponse = await fetch('https://api.clerk.com/v1/users', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
                'Content-Type': 'application/json',
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
            console.error('Clerk API Error:', errorData);
            return {
                errors: {},
                message: `Failed to create user in Clerk: ${errorData.errors?.[0]?.message || 'Unknown error'}`,
            };
        }

        const clerkUser = await clerkResponse.json();
        clerkUserId = clerkUser.id;
    } catch (error) {
        console.error('Clerk API Error:', error);
        return {
            errors: {},
            message: 'Failed to create user authentication account.',
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
        console.error('Failed to fetch admin organization:', error);
        return {
            errors: {},
            message: 'Failed to fetch admin organization.',
        };
    }

    if (!organizationId) {
        return {
            errors: {},
            message: 'Admin not found or no organization assigned.',
        };
    }

    // Now create user in database with clerk_user_id
    let userId: string;
    try {
        const normalizedIban = iban ? iban.replace(/\s+/g, '') : null;
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
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
                },
            });
        } catch (rollbackError) {
            console.error('Failed to rollback Clerk user:', rollbackError);
        }
        return {
            errors: {},
            message: 'Database Error: Failed to create user.',
        };
    }

    if (imageFile instanceof File && imageFile.size > 0) {
        try {
            await saveUserPhoto(imageFile, userId);
        } catch (error) {
            console.error(error);
            return {
                errors: {},
                message: `Failed to upload photo: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }

    revalidatePath('/dashboard/users');
    redirect('/dashboard/users');
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
            message: 'Unauthorized: Only admins can update users.',
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
        console.error('Failed to fetch admin organization:', error);
        return {
            errors: {},
            message: 'Failed to fetch admin organization.',
        };
    }

    if (!organizationId) {
        return {
            errors: {},
            message: 'Admin not found or no organization assigned.',
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
                    'User not found or does not belong to your organization.',
            };
        }

        // Se estiver atualizando um admin, IBAN é obrigatório
        const userRole = userCheck[0].role;
        const iban = formData.get('iban');
        if (
            userRole === 'admin' &&
            (!iban || (typeof iban === 'string' && iban.trim().length === 0))
        ) {
            return {
                errors: { iban: ['IBAN is required for admin users.'] },
                message: 'IBAN is required for admin users.',
            };
        }
    } catch (error) {
        return {
            errors: {},
            message: 'Failed to verify user organization.',
        };
    }

    const validatedFields = UpdateUser.safeParse({
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        iban: formData.get('iban'),
        password: formData.get('password'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing or invalid fields. Failed to update user.',
        };
    }

    const { firstName, lastName, email, iban, password } = validatedFields.data;
    const fullName = `${firstName} ${lastName}`.trim().replace(/\s+/g, ' ');
    const normalizedIban = iban ? iban.replace(/\s+/g, '') : null;

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
            message: 'Database Error: Failed to update user.',
        };
    }

    const imageFile = formData.get('imageFile');
    if (imageFile instanceof File && imageFile.size > 0) {
        try {
            await saveUserPhoto(imageFile, id);
        } catch (error) {
            console.error(error);
            return {
                errors: {},
                message: `Failed to upload photo: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }

    revalidatePath('/dashboard/users');
    redirect('/dashboard/users');
}

export async function deleteUser(id: string) {
    try {
        await checkAdminPermission();
    } catch (error) {
        throw new Error('Unauthorized: Only admins can delete users.');
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
        console.error('Failed to fetch admin organization:', error);
        throw new Error('Failed to fetch admin organization.');
    }

    if (!organizationId) {
        throw new Error('Admin not found or no organization assigned.');
    }

    // Verify that user belongs to admin's organization
    try {
        const userCheck = await sql<
            { id: string }[]
        >`SELECT id FROM users WHERE id = ${id} AND organization_id = ${organizationId}`;
        if (userCheck.length === 0) {
            throw new Error(
                'User not found or does not belong to your organization.',
            );
        }
    } catch (error) {
        throw new Error('Failed to verify user organization.');
    }

    try {
        await sql`DELETE FROM users WHERE id = ${id}`;
    } catch (error) {
        console.error(error);
        throw new Error('Database Error: Failed to delete user.');
    }

    revalidatePath('/dashboard/users');
}

export async function createOrganizationAndAdmin(formData: FormData) {
    const validatedFields = SignUpSchema.safeParse({
        orgName: formData.get('orgName'),
        adminName: formData.get('adminName'),
        email: formData.get('email'),
        password: formData.get('password'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid input',
        };
    }

    const { orgName, adminName, email, password } = validatedFields.data;

    try {
        // 1. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Create organization
        const orgSlug = orgName.toLowerCase().replace(/\s+/g, '-');

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
            message: 'Organization created successfully!',
        };
    } catch (error: any) {
        if (error.code === '23505') {
            // Unique violation
            return {
                success: false,
                message: 'Email or organization name already exists',
            };
        }

        console.error('SignUp error:', error);
        return {
            success: false,
            message: 'Failed to create organization',
        };
    }
}

// ========================================
// Atleta Actions
// ========================================

const AtletaFormSchema = z.object({
    nome: z.string().trim().min(1, { message: 'Nome é obrigatório.' }),
    sobrenome: z
        .string()
        .trim()
        .min(1, { message: 'Sobrenome é obrigatório.' }),
    data_nascimento: z
        .string()
        .min(1, { message: 'Data de nascimento é obrigatória.' }),
    morada: z.string().trim().min(1, { message: 'Morada é obrigatória.' }),
    telemovel: z
        .string()
        .trim()
        .min(1, { message: 'Telemóvel é obrigatório.' })
        .regex(/^[\d\s\+\-\(\)]{9,20}$/, { message: 'Telemóvel inválido.' }),
    email: z.string().email({ message: 'Email inválido.' }),
    peso_kg: z.coerce
        .number({ invalid_type_error: 'Peso inválido.' })
        .positive({ message: 'Peso deve ser positivo.' }),
    altura_cm: z.coerce
        .number({ invalid_type_error: 'Altura inválida.' })
        .positive({ message: 'Altura deve ser positiva.' }),
    nif: z
        .string()
        .trim()
        .regex(/^\d{9}$/, {
            message: 'NIF deve ter exatamente 9 dígitos numéricos.',
        }),
});

export async function createAtletaProfile(
    prevState: AtletaState,
    formData: FormData,
): Promise<AtletaState> {
    const { userId } = await auth();
    if (!userId) {
        return { errors: {}, message: 'Não autenticado.' };
    }

    const validatedFields = AtletaFormSchema.safeParse({
        nome: formData.get('nome'),
        sobrenome: formData.get('sobrenome'),
        data_nascimento: formData.get('data_nascimento'),
        morada: formData.get('morada'),
        telemovel: formData.get('telemovel'),
        email: formData.get('email'),
        peso_kg: formData.get('peso_kg'),
        altura_cm: formData.get('altura_cm'),
        nif: formData.get('nif'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Erro de validação. Verifique os campos.',
        };
    }

    const {
        nome,
        sobrenome,
        data_nascimento,
        morada,
        telemovel,
        email,
        peso_kg,
        altura_cm,
        nif,
    } = validatedFields.data;

    // Handle photo upload
    const fotoFile = formData.get('foto_perfil') as File | null;
    if (!fotoFile || fotoFile.size === 0) {
        return {
            errors: { foto_perfil: ['Foto de perfil é obrigatória.'] },
            message: 'Foto de perfil é obrigatória.',
        };
    }
    if (fotoFile.size > MAX_PHOTO_SIZE) {
        return {
            errors: { foto_perfil: ['Foto deve ter menos de 5MB.'] },
            message: 'Foto muito grande.',
        };
    }

    let foto_perfil_url: string;
    try {
        foto_perfil_url = await uploadAtletaPhotoToR2(
            fotoFile,
            nif,
            nome,
            sobrenome,
        );
    } catch (error) {
        console.error('R2 upload error:', error);
        return {
            errors: {},
            message: 'Erro ao fazer upload da foto. Tente novamente.',
        };
    }

    try {
        await sql`
            INSERT INTO utilizador
                (nome, sobrenome, data_nascimento, morada, telemovel, email, foto_perfil_url, peso_kg, altura_cm, nif, estado)
            VALUES
                (${nome}, ${sobrenome}, ${data_nascimento}, ${morada}, ${telemovel},
                 ${email}, ${foto_perfil_url}, ${peso_kg}, ${altura_cm}, ${nif}, 'Pendente')
        `;
    } catch (error: any) {
        if (error.code === '23505') {
            return {
                errors: {},
                message: 'Já existe um perfil com este email ou NIF.',
            };
        }
        console.error('DB insert atleta error:', error);
        return {
            errors: {},
            message: 'Erro ao guardar perfil. Tente novamente.',
        };
    }

    revalidatePath('/dashboard/utilizador/perfil');
    redirect('/dashboard/utilizador/perfil');
}

export async function updateAtletaProfile(
    prevState: AtletaState,
    formData: FormData,
): Promise<AtletaState> {
    const { userId } = await auth();
    if (!userId) {
        return { errors: {}, message: 'Não autenticado.' };
    }

    const validatedFields = AtletaFormSchema.safeParse({
        nome: formData.get('nome'),
        sobrenome: formData.get('sobrenome'),
        data_nascimento: formData.get('data_nascimento'),
        morada: formData.get('morada'),
        telemovel: formData.get('telemovel'),
        email: formData.get('email'),
        peso_kg: formData.get('peso_kg'),
        altura_cm: formData.get('altura_cm'),
        nif: formData.get('nif'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Erro de validação. Verifique os campos.',
        };
    }

    const {
        nome,
        sobrenome,
        data_nascimento,
        morada,
        telemovel,
        email,
        peso_kg,
        altura_cm,
        nif,
    } = validatedFields.data;

    // Fetch existing profile to preserve photo if none uploaded
    const existing = await sql<{ foto_perfil_url: string | null }[]>`
        SELECT a.foto_perfil_url
        FROM utilizador a
        JOIN users u ON u.email = a.email
        WHERE u.clerk_user_id = ${userId}
    `;
    if (!existing.length) {
        return { errors: {}, message: 'Perfil não encontrado.' };
    }
    let foto_perfil_url = existing[0].foto_perfil_url;

    const fotoFile = formData.get('foto_perfil') as File | null;
    if (fotoFile && fotoFile.size > 0) {
        if (fotoFile.size > MAX_PHOTO_SIZE) {
            return {
                errors: { foto_perfil: ['Foto deve ter menos de 5MB.'] },
                message: 'Foto muito grande.',
            };
        }
        try {
            foto_perfil_url = await uploadAtletaPhotoToR2(
                fotoFile,
                nif,
                nome,
                sobrenome,
            );
        } catch (error) {
            console.error('R2 upload error:', error);
            return {
                errors: {},
                message: 'Erro ao fazer upload da foto. Tente novamente.',
            };
        }
    }

    try {
        await sql`
            UPDATE utilizador
            SET
                nome             = ${nome},
                sobrenome        = ${sobrenome},
                data_nascimento  = ${data_nascimento},
                morada           = ${morada},
                telemovel        = ${telemovel},
                email            = ${email},
                foto_perfil_url  = ${foto_perfil_url},
                peso_kg          = ${peso_kg},
                altura_cm        = ${altura_cm},
                nif              = ${nif},
                updated_at       = NOW()
            WHERE email IN (
                SELECT email FROM users WHERE clerk_user_id = ${userId}
            )
        `;
    } catch (error: any) {
        if (error.code === '23505') {
            return {
                errors: {},
                message: 'Já existe um perfil com este email ou NIF.',
            };
        }
        console.error('DB update atleta error:', error);
        return {
            errors: {},
            message: 'Erro ao guardar perfil. Tente novamente.',
        };
    }

    revalidatePath('/dashboard/utilizador/perfil');
    redirect('/dashboard/utilizador/perfil');
}

type ComunicadoState = { error?: string; success?: boolean } | null;

export async function criarComunicado(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const organizationId = await getOrganizationId();

    const titulo       = formData.get('titulo') as string;
    const conteudo     = formData.get('conteudo') as string;
    const destinatarios = formData.get('destinatarios') as string;

    if (!titulo?.trim() || !conteudo?.trim() || !destinatarios?.trim()) {
        return { error: 'Preenche todos os campos obrigatórios.' };
    }

    try {
        const { userId: clerkId } = await auth();

        // CORREÇÃO: buscar UUID real da base de dados
        const userResult = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkId}
        `;
        const dbUserId = userResult[0]?.id ?? null;

        await sql`
            INSERT INTO comunicados (titulo, conteudo, destinatarios, criado_por, organization_id, created_at)
            VALUES (${titulo.trim()}, ${conteudo.trim()}, ${destinatarios.trim()}, ${dbUserId}, ${organizationId}, NOW())
        `;

        revalidatePath('/dashboard/presidente/comunicados');
        return { success: true };
    } catch (error) {
        console.error('Database Error:', error);
        return { error: 'Erro ao enviar comunicado. Tenta novamente.' };
    }
}




// ---------- AUTORIZAÇÕES ----------

export async function registarAutorizacao(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const organizationId = await getOrganizationId();

    const autorizadoA = formData.get('autorizado_a') as string;
    const tipoAcao    = formData.get('tipo_acao') as string;
    const notas       = formData.get('notas') as string | null;

    if (!autorizadoA?.trim() || !tipoAcao?.trim()) {
        return { error: 'Preenche todos os campos obrigatórios.' };
    }

    try {
        const { userId: clerkId } = await auth();

        // CORREÇÃO: buscar UUID real da base de dados
        const userResult = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkId}
        `;
        const dbUserId = userResult[0]?.id ?? null;

        await sql`
            INSERT INTO autorizacoes_log (autorizado_a, autorizado_por, tipo_acao, notas, organization_id, created_at)
            VALUES (${autorizadoA.trim()}, ${dbUserId}, ${tipoAcao.trim()}, ${notas?.trim() ?? null}, ${organizationId}, NOW())
        `;

        revalidatePath('/dashboard/presidente/autorizacoes');
        return { success: true };
    } catch (error) {
        console.error('Database Error:', error);
        return { error: 'Erro ao registar autorização.' };
    }
}



// ---------- DOCUMENTOS ----------

export async function uploadDocumento(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const organizationId = await getOrganizationId();

    const file = formData.get('ficheiro') as File | null;
    const nome = formData.get('nome') as string;

    if (!file || file.size === 0) return { error: 'Seleciona um ficheiro.' };
    if (!nome?.trim()) return { error: 'Indica um nome para o documento.' };

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) return { error: 'Ficheiro demasiado grande. Máximo 10MB.' };

    const extensao = file.name.split('.').pop()?.toUpperCase() ?? 'PDF';
    const tiposPermitidos = ['PDF', 'XLSX', 'DOCX'];
    if (!tiposPermitidos.includes(extensao)) {
        return { error: 'Tipo de ficheiro não permitido. Usa PDF, XLSX ou DOCX.' };
    }

    try {
        const { userId: clerkId } = await auth();

        // CORREÇÃO: buscar o UUID real da base de dados
        const userResult = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkId}
        `;
        const dbUserId = userResult[0]?.id ?? null;

        const url = await uploadImageToR2(file, 'user', crypto.randomUUID());

        await sql`
            INSERT INTO documentos (nome, tipo, url_r2, uploaded_by, organization_id, created_at)
            VALUES (${nome.trim()}, ${extensao}, ${url}, ${dbUserId}, ${organizationId}, NOW())
        `;

        revalidatePath('/dashboard/presidente/documentos');
        return { success: true };
    } catch (error) {
        console.error('Database Error:', error);
        return { error: 'Erro ao carregar documento. Tenta novamente.' };
    }
}


export async function criarEquipa(
    _prevState: { error?: string; success?: boolean } | null,
    formData: FormData
): Promise<{ error?: string; success?: boolean } | null> {
    let organizationId: string;

    try {
        organizationId = await getOrganizationId();
    } catch (error) {
        console.error("Failed to resolve organization for creating team:", error);
        return { error: "Não foi possível identificar a organização. Tenta novamente." };
    }

    const nome     = formData.get("nome")     as string;
    const escalao  = formData.get("escalao")  as string;
    const desporto = formData.get("desporto") as string;
    const estado   = formData.get("estado")   as string;

    if (!nome?.trim() || !escalao?.trim() || !desporto?.trim() || !estado?.trim()) {
        return { error: "Preenche todos os campos obrigatórios." };
    }

    try {
        const epocas = await sql<{ id: string }[]>`
            SELECT id FROM epocas
            WHERE organization_id = ${organizationId} AND ativa = true
            LIMIT 1
        `;
        const epocaId = epocas[0]?.id ?? null;

        await sql`
            INSERT INTO equipas (nome, escalao, desporto, estado, epoca_id, organization_id, created_at, updated_at)
            VALUES (
                ${nome.trim()}, ${escalao.trim()}, ${desporto.trim()},
                ${estado}, ${epocaId}, ${organizationId}, NOW(), NOW()
            )
        `;

        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
            VALUES (
                gen_random_uuid(),
                ${organizationId},
                'Nova equipa criada',
                ${`Equipa ${nome.trim()} (${escalao.trim()}) foi criada com sucesso.`},
                'Info',
                NOW()
            )
        `;

        revalidatePath("/dashboard/presidente/equipas");
        revalidatePath("/dashboard/presidente/notificacoes");
        return { success: true };
    } catch (error) {
        console.error("Database Error:", error);
        return { error: "Erro ao criar equipa. Tenta novamente." };
    }
}


// ========================================
// Atleta Actions (Modal)
// ========================================

export async function adicionarAtleta(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId } = await auth();
    if (!userId) return { error: 'Não autenticado.' };

    let organizationId: string | undefined;
    try {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${userId}`;
        organizationId = user[0]?.organization_id;
    } catch {
        return { error: 'Erro ao obter organização.' };
    }

    if (!organizationId) return { error: 'Organização não encontrada.' };

    const nome         = formData.get('nome')?.toString().trim();
    const posicao      = formData.get('posicao')?.toString().trim()        || null;
    const numCamisola  = formData.get('numero_camisola')?.toString().trim() || null;
    const equipaId     = formData.get('equipa_id')?.toString()              || null;
    const estado       = formData.get('estado')?.toString()                 || 'ativo';
    const federado     = formData.get('federado') === 'on';
    const numFederado  = formData.get('numero_federado')?.toString().trim() || null;
    const maoDominante = formData.get('mao_dominante')?.toString()          || null;

    if (!nome) return { error: 'Nome é obrigatório.' };

    try {
        await sql`
            INSERT INTO atletas (
                id, nome, posicao, numero_camisola,
                equipa_id, estado, federado, numero_federado,
                mao_dominante, organization_id
            ) VALUES (
                gen_random_uuid(), ${nome}, ${posicao},
                ${numCamisola ? parseInt(numCamisola) : null},
                ${equipaId}, ${estado}, ${federado}, ${numFederado},
                ${maoDominante}, ${organizationId}
            )
        `;

        // Buscar nome da equipa para a notificação
        let equipaNome = 'sem equipa';
        if (equipaId) {
            const equipaResult = await sql<{ nome: string }[]>`
                SELECT nome FROM equipas WHERE id = ${equipaId}
            `;
            equipaNome = equipaResult[0]?.nome ?? 'sem equipa';
        }

        // Notificação automática
        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
            VALUES (
                gen_random_uuid(),
                ${organizationId},
                'Novo atleta registado',
                ${`${nome} foi adicionado${equipaId ? ` à equipa ${equipaNome}` : ' sem equipa atribuída'}.`},
                'Info',
                NOW()
            )
        `;
    } catch (error) {
        console.error(error);
        return { error: 'Erro ao adicionar atleta.' };
    }

    revalidatePath('/dashboard/presidente/atletas');
    revalidatePath('/dashboard/presidente/notificacoes');
    return { success: true };
}


// ========================================
// Staff Actions (Modal)
// ========================================

export async function adicionarMembro(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId } = await auth();
    if (!userId) return { error: 'Não autenticado.' };

    let organizationId: string | undefined;
    try {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${userId}`;
        organizationId = user[0]?.organization_id;
    } catch {
        return { error: 'Erro ao obter organização.' };
    }

    if (!organizationId) return { error: 'Organização não encontrada.' };

    const nome     = formData.get('nome')?.toString().trim();
    const funcao   = formData.get('funcao')?.toString() || null;
    const equipaId = formData.get('equipa_id')?.toString() || null;

    if (!nome) return { error: 'Nome é obrigatório.' };
    if (!funcao) return { error: 'Função é obrigatória.' };

    try {
        await sql`
            INSERT INTO staff (id, nome, funcao, equipa_id, organization_id)
            VALUES (gen_random_uuid(), ${nome}, ${funcao}, ${equipaId}, ${organizationId})
        `;
    } catch (error) {
        console.error(error);
        return { error: 'Erro ao adicionar membro de staff.' };
    }

    revalidatePath('/dashboard/presidente/staff');
    return { success: true };
}

// ========================================
// Jogos Actions (Modal)
// ========================================

export async function agendarJogo(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId } = await auth();
    if (!userId) return { error: 'Não autenticado.' };

    let organizationId: string | undefined;
    try {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${userId}`;
        organizationId = user[0]?.organization_id;
    } catch {
        return { error: 'Erro ao obter organização.' };
    }

    if (!organizationId) return { error: 'Organização não encontrada.' };

    const adversario          = formData.get('adversario')?.toString().trim();
    const data                = formData.get('data')?.toString();
    const equipaId            = formData.get('equipa_id')?.toString() || null;
    const casaFora            = formData.get('casa_fora')?.toString() || 'casa';
    const local               = formData.get('local')?.toString().trim() || null;
    const estado              = formData.get('estado')?.toString() || 'agendado';
    const visibilidadePublica = formData.get('visibilidade_publica') === 'on';

    if (!adversario) return { error: 'Adversário é obrigatório.' };
    if (!data)       return { error: 'Data é obrigatória.' };

    try {
        await sql`
            INSERT INTO jogos (
                id, adversario, data, equipa_id, casa_fora,
                local, estado, visibilidade_publica, organization_id
            ) VALUES (
                gen_random_uuid(), ${adversario}, ${data}, ${equipaId},
                ${casaFora}, ${local}, ${estado}, ${visibilidadePublica}, ${organizationId}
            )
        `;

        // Buscar nome da equipa para a notificação
        let equipaNome = '';
        if (equipaId) {
            const equipaResult = await sql<{ nome: string }[]>`
                SELECT nome FROM equipas WHERE id = ${equipaId}
            `;
            equipaNome = equipaResult[0]?.nome ?? '';
        }

        const dataFormatada = new Date(data).toLocaleDateString("pt-PT", {
            day: "2-digit", month: "short", year: "numeric"
        });

        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
            VALUES (
                gen_random_uuid(),
                ${organizationId},
                'Jogo agendado',
                ${`Jogo vs ${adversario}${equipaNome ? ` (${equipaNome})` : ''} agendado para ${dataFormatada}.`},
                'Info',
                NOW()
            )
        `;
    } catch (error) {
        console.error(error);
        return { error: 'Erro ao agendar jogo.' };
    }

    revalidatePath('/dashboard/presidente/jogos');
    revalidatePath('/dashboard/presidente/notificacoes');
    return { success: true };
}


// ========================================
// Época Actions (Modal)
// ========================================

export async function criarEpoca(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    let organizationId: string;
    try {
        organizationId = await getOrganizationId();
    } catch {
        return { error: 'Não foi possível identificar a organização.' };
    }

    const nome       = formData.get('nome')?.toString().trim();
    const dataInicio = formData.get('data_inicio')?.toString();
    const dataFim    = formData.get('data_fim')?.toString();
    const ativa      = formData.get('ativa') === 'on';

    if (!nome)       return { error: 'Nome é obrigatório.' };
    if (!dataInicio) return { error: 'Data de início é obrigatória.' };
    if (!dataFim)    return { error: 'Data de fim é obrigatória.' };
    if (dataFim <= dataInicio) return { error: 'A data de fim deve ser posterior à data de início.' };

    try {
        if (ativa) {
            await sql`
                UPDATE epocas SET ativa = false
                WHERE organization_id = ${organizationId}
            `;
        }

        await sql`
            INSERT INTO epocas (id, nome, data_inicio, data_fim, ativa, organization_id, created_at, updated_at)
            VALUES (gen_random_uuid(), ${nome}, ${dataInicio}, ${dataFim}, ${ativa}, ${organizationId}, NOW(), NOW())
        `;

        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
            VALUES (
                gen_random_uuid(),
                ${organizationId},
                'Nova época criada',
                ${`Época ${nome} criada${ativa ? ' e definida como ativa' : ''}.`},
                'Info',
                NOW()
            )
        `;
    } catch (error) {
        console.error(error);
        return { error: 'Erro ao criar época.' };
    }

    revalidatePath('/dashboard/presidente/epoca');
    revalidatePath('/dashboard/presidente/notificacoes');
    return { success: true };
}


// ========================================
// Organização Actions
// ========================================

export async function atualizarOrganizacao(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    let organizationId: string;
    try {
        organizationId = await getOrganizationId();
    } catch {
        return { error: 'Organização não encontrada.' };
    }

    const name         = formData.get('name')?.toString().trim();
    const desporto     = formData.get('desporto')?.toString().trim() || null;
    const cidade       = formData.get('cidade')?.toString().trim() || null;
    const pais         = formData.get('pais')?.toString().trim() || null;
    const website      = formData.get('website')?.toString().trim() || null;
    const nif          = formData.get('nif')?.toString().trim() || null;
    const telefone     = formData.get('telefone')?.toString().trim() || null;
    const morada       = formData.get('morada')?.toString().trim() || null;
    const codigoPostal = formData.get('codigo_postal')?.toString().trim() || null;

    if (!name) return { error: 'Nome do clube é obrigatório.' };

    if (nif && !/^\d{9}$/.test(nif)) {
        return { error: 'NIF deve ter exatamente 9 dígitos numéricos.' };
    }

    try {
        await sql`
            UPDATE organizations
            SET
                name          = ${name},
                desporto      = ${desporto},
                cidade        = ${cidade},
                pais          = ${pais},
                website       = ${website},
                nif           = ${nif},
                telefone      = ${telefone},
                morada        = ${morada},
                codigo_postal = ${codigoPostal},
                updated_at    = NOW()
            WHERE id = ${organizationId}
        `;
    } catch (error) {
        console.error(error);
        return { error: 'Erro ao atualizar definições.' };
    }

    revalidatePath('/dashboard/presidente/definicoes');
    return { success: true };
}


// ========================================
// Mensalidades Actions (Modal)
// ========================================

export async function registarPagamento(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    let organizationId: string;
    try {
        organizationId = await getOrganizationId();
    } catch {
        return { error: 'Não foi possível identificar a organização.' };
    }

    const atletaId      = formData.get('atleta_id')?.toString();
    const mes           = formData.get('mes')?.toString();
    const ano           = formData.get('ano')?.toString();
    const valor         = formData.get('valor')?.toString();
    const estado        = formData.get('estado')?.toString() || 'pago';
    const dataPagamento = formData.get('data_pagamento')?.toString() || null;

    if (!atletaId) return { error: 'Atleta não identificado.' };
    if (!mes)      return { error: 'Mês é obrigatório.' };
    if (!ano)      return { error: 'Ano é obrigatório.' };
    if (!valor)    return { error: 'Valor é obrigatório.' };

    try {
        const { userId: clerkId } = await auth();
        const userResult = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE clerk_user_id = ${clerkId}
        `;
        const dbUserId = userResult[0]?.id ?? null;

        // Buscar nome do atleta para a notificação
        const atletaResult = await sql<{ nome: string }[]>`
            SELECT nome FROM atletas WHERE id = ${atletaId}
        `;
        const atletaNome = atletaResult[0]?.nome ?? 'Atleta desconhecido';

        // Upsert mensalidade
        await sql`
            INSERT INTO mensalidades (id, atleta_id, mes, ano, valor, estado, data_pagamento, updated_by, organization_id, created_at, updated_at)
            VALUES (gen_random_uuid(), ${atletaId}, ${mes}, ${ano}, ${valor}, ${estado}, ${dataPagamento}, ${dbUserId}, ${organizationId}, NOW(), NOW())
            ON CONFLICT (atleta_id, mes, ano)
            DO UPDATE SET
                valor = EXCLUDED.valor,
                estado = EXCLUDED.estado,
                data_pagamento = EXCLUDED.data_pagamento,
                updated_by = EXCLUDED.updated_by,
                updated_at = NOW()
        `;

        // Notificação automática se em atraso
        if (estado === 'em_atraso') {
            const mesesNomes: Record<string, string> = {
                "1": "Janeiro",  "2": "Fevereiro", "3": "Março",    "4": "Abril",
                "5": "Maio",     "6": "Junho",     "7": "Julho",    "8": "Agosto",
                "9": "Setembro", "10": "Outubro",  "11": "Novembro","12": "Dezembro",
            };
            await sql`
                INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
                VALUES (
                    gen_random_uuid(),
                    ${organizationId},
                    'Mensalidade em atraso',
                    ${`${atletaNome} tem mensalidade de ${mesesNomes[mes] ?? mes} ${ano} em atraso.`},
                    'Alerta',
                    NOW()
                )
            `;
        }
    } catch (error) {
        console.error(error);
        return { error: 'Erro ao registar pagamento.' };
    }

    revalidatePath(`/dashboard/presidente/atletas/${atletaId}`);
    revalidatePath('/dashboard/presidente/mensalidades');
    revalidatePath('/dashboard/presidente/notificacoes');
    return { success: true };
}


// ========================================
// Suspender Atleta
// ========================================

export async function suspenderAtleta(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    let organizationId: string;
    try {
        organizationId = await getOrganizationId();
    } catch {
        return { error: 'Não foi possível identificar a organização.' };
    }

    const atletaId = formData.get('atleta_id')?.toString();
    if (!atletaId) return { error: 'Atleta não identificado.' };

    try {
        // Buscar nome do atleta para a notificação
        const atletaResult = await sql<{ nome: string }[]>`
            SELECT nome FROM atletas WHERE id = ${atletaId}
        `;
        const atletaNome = atletaResult[0]?.nome ?? 'Atleta desconhecido';

        await sql`
            UPDATE atletas SET estado = 'suspenso', updated_at = NOW()
            WHERE id = ${atletaId} AND organization_id = ${organizationId}
        `;

        // Notificação automática
        await sql`
            INSERT INTO notificacoes (id, organization_id, titulo, descricao, tipo, created_at)
            VALUES (
                gen_random_uuid(),
                ${organizationId},
                'Atleta suspenso',
                ${`${atletaNome} foi suspenso por mensalidade em atraso.`},
                'Aviso',
                NOW()
            )
        `;
    } catch (error) {
        console.error(error);
        return { error: 'Erro ao suspender atleta.' };
    }

    revalidatePath('/dashboard/presidente/mensalidades');
    revalidatePath(`/dashboard/presidente/atletas/${atletaId}`);
    revalidatePath('/dashboard/presidente/notificacoes');
    return { success: true };
}


// ========================================
// Notificações Actions
// ========================================

export async function marcarTodasComoLidas(
    prevState: { error?: string; success?: boolean } | null,
    _formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    let organizationId: string;
    try {
        organizationId = await getOrganizationId();
    } catch {
        return { error: 'Não foi possível identificar a organização.' };
    }

    try {
        await sql`
            UPDATE notificacoes SET lida = true
            WHERE organization_id = ${organizationId} AND lida = false
        `;
    } catch (error) {
        console.error(error);
        return { error: 'Erro ao marcar notificações.' };
    }

    revalidatePath('/dashboard/presidente/notificacoes');
    return { success: true };
}

export async function atualizarMeuPerfil(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return { error: 'Não autenticado.' };

    const firstName = formData.get('firstName')?.toString().trim();
    const lastName  = formData.get('lastName')?.toString().trim();
    const iban      = formData.get('iban')?.toString().trim() || null;

    if (!firstName) return { error: 'Nome é obrigatório.' };
    if (!lastName)  return { error: 'Apelido é obrigatório.' };

    const normalizedIban = iban ? iban.replace(/\s/g, '') : null;
    if (normalizedIban && !/^[A-Z]{2}[A-Z0-9]{11,30}$/.test(normalizedIban)) {
        return { error: 'IBAN inválido.' };
    }

    try {
        // Atualiza nome no Clerk
        const clerkRes = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ first_name: firstName, last_name: lastName }),
        });
        if (!clerkRes.ok) return { error: 'Erro ao atualizar nome.' };

        // Atualiza DB
        await sql`
            UPDATE users
            SET name = ${`${firstName} ${lastName}`.trim()}, iban = ${normalizedIban}
            WHERE clerk_user_id = ${clerkUserId}
        `;
    } catch (error) {
        console.error(error);
        return { error: 'Erro ao atualizar perfil.' };
    }

    revalidatePath('/dashboard/presidente/perfil');
    return { success: true };
}

export async function editarAtleta(
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
): Promise<{ error?: string; success?: boolean } | null> {
    const { userId } = await auth();
    if (!userId) return { error: 'Não autenticado.' };

    let organizationId: string | undefined;
    try {
        const user = await sql<
            { organization_id: string }[]
        >`SELECT organization_id FROM users WHERE clerk_user_id = ${userId}`;
        organizationId = user[0]?.organization_id;
    } catch {
        return { error: 'Erro ao obter organização.' };
    }
    if (!organizationId) return { error: 'Organização não encontrada.' };

    const id           = formData.get('id')?.toString();
    const nome         = formData.get('nome')?.toString().trim();
    const posicao      = formData.get('posicao')?.toString().trim()         || null;
    const numCamisola  = formData.get('numero_camisola')?.toString().trim()  || null;
    const equipaId     = formData.get('equipa_id')?.toString()               || null;
    const estado       = formData.get('estado')?.toString()                  || 'ativo';
    const federado     = formData.get('federado') === 'on';
    const numFederado  = formData.get('numero_federado')?.toString().trim()  || null;
    const maoDominante = formData.get('mao_dominante')?.toString()           || null;

    if (!id)   return { error: 'ID do atleta em falta.' };
    if (!nome) return { error: 'Nome é obrigatório.' };

    try {
        await sql`
            UPDATE atletas SET
                nome             = ${nome},
                posicao          = ${posicao},
                numero_camisola  = ${numCamisola ? parseInt(numCamisola) : null},
                equipa_id        = ${equipaId},
                estado           = ${estado},
                federado         = ${federado},
                numero_federado  = ${numFederado},
                mao_dominante    = ${maoDominante}
            WHERE id = ${id}
            AND organization_id = ${organizationId}
        `;
    } catch (error) {
        console.error(error);
        return { error: 'Erro ao editar atleta.' };
    }

    revalidatePath('/dashboard/presidente/atletas');
    return { success: true };
}

// ========================
// RELATÓRIOS CSV
// ========================

export async function gerarRelatorioAtletas() {
    const { userId } = await auth();
    if (!userId) throw new Error('Não autenticado.');

    let organizationId: string | undefined;
    try {
        const user = await sql<{ organization_id: string }[]>`
            SELECT organization_id FROM users WHERE clerk_user_id = ${userId}
        `;
        organizationId = user[0]?.organization_id;
    } catch {
        throw new Error('Erro ao obter organização.');
    }
    if (!organizationId) throw new Error('Organização não encontrada.');

    const atletas = await sql<{
        nome:               string;
        posicao:            string | null;
        numero_camisola:    number | null;
        equipa_nome:        string | null;
        estado:             string;
        federado:           boolean;
        numero_federado:    string | null;
        mensalidade_estado: string | null;
    }[]>`
        SELECT
            atletas.nome,
            atletas.posicao,
            atletas.numero_camisola,
            equipas.nome AS equipa_nome,
            atletas.estado,
            atletas.federado,
            atletas.numero_federado,
            mensalidades.estado AS mensalidade_estado
        FROM atletas
        LEFT JOIN equipas ON atletas.equipa_id = equipas.id
        LEFT JOIN mensalidades ON mensalidades.atleta_id = atletas.id
            AND mensalidades.mes = EXTRACT(MONTH FROM CURRENT_DATE)
            AND mensalidades.ano = EXTRACT(YEAR FROM CURRENT_DATE)
        WHERE atletas.organization_id = ${organizationId}
        ORDER BY atletas.nome ASC
    `;

    // Gerar CSV
    const headers = ['Nome', 'Posição', 'Nº', 'Equipa', 'Estado', 'Federado', 'Nº Federado', 'Mensalidade'];
    const rows = atletas.map(a => [
        a.nome,
        a.posicao ?? '—',
        a.numero_camisola != null ? `#${a.numero_camisola}` : '—',
        a.equipa_nome ?? '—',
        a.estado,
        a.federado ? 'Sim' : 'Não',
        a.numero_federado ?? '—',
        a.mensalidade_estado ?? '—',
    ]);

    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    return csv;
}

export async function gerarRelatorioMensalidades() {
    const { userId } = await auth();
    if (!userId) throw new Error('Não autenticado.');

    let organizationId: string | undefined;
    try {
        const user = await sql<{ organization_id: string }[]>`
            SELECT organization_id FROM users WHERE clerk_user_id = ${userId}
        `;
        organizationId = user[0]?.organization_id;
    } catch {
        throw new Error('Erro ao obter organização.');
    }
    if (!organizationId) throw new Error('Organização não encontrada.');

    const mensalidades = await sql<{
        atleta_nome: string;
        equipa_nome: string | null;
        mes:         number;
        ano:         number;
        valor:       number | null;
        estado:      string;
        data_pago:   string | null;
    }[]>`
        SELECT
            atletas.nome AS atleta_nome,
            equipas.nome AS equipa_nome,
            mensalidades.mes,
            mensalidades.ano,
            mensalidades.valor,
            mensalidades.estado,
            mensalidades.data_pagamento AS data_pago
        FROM mensalidades
        INNER JOIN atletas ON mensalidades.atleta_id = atletas.id
        LEFT JOIN equipas ON atletas.equipa_id = equipas.id
        WHERE mensalidades.mes = EXTRACT(MONTH FROM CURRENT_DATE)
          AND mensalidades.ano = EXTRACT(YEAR FROM CURRENT_DATE)
          AND atletas.organization_id = ${organizationId}
        ORDER BY mensalidades.estado DESC, atletas.nome ASC
    `;

    const mesesNomes: Record<number, string> = {
        1: 'Jan', 2: 'Fev', 3: 'Mar', 4: 'Abr', 5: 'Mai', 6: 'Jun',
        7: 'Jul', 8: 'Ago', 9: 'Set', 10: 'Out', 11: 'Nov', 12: 'Dez',
    };

    const headers = ['Atleta', 'Equipa', 'Mês', 'Ano', 'Valor', 'Estado', 'Data Pagamento'];
    const rows = mensalidades.map(m => [
        m.atleta_nome,
        m.equipa_nome ?? '—',
        mesesNomes[m.mes] ?? m.mes,
        m.ano,
        m.valor != null ? `€${Number(m.valor).toFixed(2)}` : '—',
        m.estado,
        m.data_pago ? new Date(m.data_pago).toLocaleDateString('pt-PT') : '—',
    ]);

    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    return csv;
}

export async function gerarRelatorioAssiduidade() {
    const { userId } = await auth();
    if (!userId) throw new Error('Não autenticado.');

    let organizationId: string | undefined;
    try {
        const user = await sql<{ organization_id: string }[]>`
            SELECT organization_id FROM users WHERE clerk_user_id = ${userId}
        `;
        organizationId = user[0]?.organization_id;
    } catch {
        throw new Error('Erro ao obter organização.');
    }
    if (!organizationId) throw new Error('Organização não encontrada.');

    const assiduidade = await sql<{
        atleta_nome:   string;
        equipa_nome:   string | null;
        total_treinos: number;
        presencas:     number;
    }[]>`
        SELECT
            atletas.nome AS atleta_nome,
            equipas.nome AS equipa_nome,
            COUNT(assiduidade.id) AS total_treinos,
            COUNT(CASE WHEN assiduidade.presente THEN 1 END) AS presencas
        FROM atletas
        LEFT JOIN equipas ON atletas.equipa_id = equipas.id
        LEFT JOIN assiduidade ON assiduidade.atleta_id = atletas.id
        WHERE atletas.organization_id = ${organizationId}
        GROUP BY atletas.id, atletas.nome, equipas.nome
        ORDER BY atletas.nome ASC
    `;

    const headers = ['Atleta', 'Equipa', 'Total Treinos', 'Presenças', 'Taxa Assiduidade'];
    const rows = assiduidade.map(a => {
        const total = Number(a.total_treinos);
        const presencas = Number(a.presencas);
        const taxa = total > 0 ? Math.round((presencas / total) * 100) : 0;
        return [
            a.atleta_nome,
            a.equipa_nome ?? '—',
            total,
            presencas,
            `${taxa}%`,
        ];
    });

    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    return csv;
}

export async function gerarRelatorioStaff() {
    const { userId } = await auth();
    if (!userId) throw new Error('Não autenticado.');

    let organizationId: string | undefined;
    try {
        const user = await sql<{ organization_id: string }[]>`
            SELECT organization_id FROM users WHERE clerk_user_id = ${userId}
        `;
        organizationId = user[0]?.organization_id;
    } catch {
        throw new Error('Erro ao obter organização.');
    }
    if (!organizationId) throw new Error('Organização não encontrada.');

    const staff = await sql<{
        nome:        string;
        funcao:      string;
        equipa_nome: string | null;
        email:       string | null;
        telefone:    string | null;
    }[]>`
        SELECT
            staff.nome,
            staff.funcao,
            equipas.nome AS equipa_nome,
            users.email,
            users.telefone
        FROM staff
        LEFT JOIN equipas ON staff.equipa_id = equipas.id
        LEFT JOIN users ON staff.user_id = users.id
        WHERE staff.organization_id = ${organizationId}
        ORDER BY staff.funcao, staff.nome ASC
    `;

    const headers = ['Nome', 'Função', 'Equipa', 'Email', 'Telefone'];
    const rows = staff.map(s => [
        s.nome,
        s.funcao,
        s.equipa_nome ?? '—',
        s.email ?? '—',
        s.telefone ?? '—',
    ]);

    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    return csv;
}














