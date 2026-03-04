// ========================================
// Organization Types
// ========================================
export type Organization = {
    id: string;
    name: string;
    slug: string;
    owner_id: string | null;
    created_at: string;
    updated_at: string;
};

// ========================================
// User Types
// ========================================
export type User = {
    id: string;
    name: string;
    email: string;
    password: string;
    image_url: string;
    role?: "admin" | "user";
    organization_id?: string;
    iban?: string | null;
};

// ========================================
// Customer Types
// ========================================
export type Customer = {
    id: string;
    name: string;
    email: string;
    image_url: string;
    nif?: string;
    endereco_fiscal?: string;
    organization_id?: string;
    created_by?: string;
};

export type CustomerField = {
    id: string;
    name: string;
};

export type CustomersTableType = {
    id: string;
    name: string;
    email: string;
    image_url: string;
    nif: string | null;
    endereco_fiscal: string | null;
    created_by: string | null;
    total_invoices: number;
    total_pending: number;
    total_paid: number;
};

export type FormattedCustomersTable = {
    id: string;
    name: string;
    email: string;
    image_url: string;
    nif: string | null;
    endereco_fiscal: string | null;
    created_by: string | null;
    total_invoices: number;
    total_pending: number;
    total_paid: number;
};

// ========================================
// Invoice Types
// ========================================
export type Invoice = {
    id: string;
    customer_id: string;
    amount: number;
    date: string;
    payment_date?: string | null;
    status: "pending" | "paid";
    organization_id?: string;
    created_by?: string;
};

export type InvoiceForm = {
    id: string;
    customer_id: string;
    amount: number;
    date: string;
    payment_date?: string | null;
    status: "pending" | "paid";
};

export type InvoicesTable = {
    id: string;
    customer_id: string;
    name: string;
    email: string;
    image_url: string;
    date: string;
    payment_date?: string | null;
    amount: number;
    status: "pending" | "paid";
};

export type LatestInvoice = {
    id: string;
    name: string;
    image_url: string;
    email: string;
    amount: number;
    date: string;
    payment_date?: string | null;
    status: "pending" | "paid";
};

export type LatestInvoiceRaw = Omit<LatestInvoice, "amount" | "date"> & {
    amount: number;
    date: string;
    payment_date?: string | null;
};

// ========================================
// Revenue Types
// ========================================
export type Revenue = {
    month: string;
    revenue: number;
    organization_id?: string;
};

// ========================================
// Receipt Types
// ========================================
export type ReceiptStatus = "pending_send" | "sent_to_customer";

export type Receipt = {
    id: string;
    receipt_number: number;
    invoice_id: string;
    customer_id: string;
    organization_id: string;
    created_by: string | null;
    status: ReceiptStatus;
    received_date: string;
    amount: number;
    payment_method: string;
    issuer_iban: string;
    activity_code: string | null;
    tax_regime: string;
    irs_withholding: string;
    pdf_url: string | null;
    sent_at: string | null;
    sent_by_user: string | null;
    created_at: string;
    updated_at: string;
};

export type ReceiptsTableRow = {
    id: string;
    receipt_number: number;
    customer_name: string;
    customer_email: string;
    customer_id: string;
    amount: number;
    invoice_date: string;
    received_date: string;
    payment_date: string | null;
    status: ReceiptStatus;
    pdf_url: string | null;
    receipt_created_by: string | null;
    invoice_id: string;
};
