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
    account_type?: "presidente" | "treinador" | "atleta" | "responsavel" | null;
};

// ========================================
// Recibo Types (antigo Receipt, agora ligado a mensalidades/atletas)
// ========================================
export type ReciboStatus = "pendente_envio" | "enviado_atleta";

export type Recibo = {
    id: string;
    recibo_number: number;
    mensalidade_id: string;
    atleta_id: string;
    organization_id: string;
    created_by: string | null;
    status: ReciboStatus;
    received_date: string;
    amount: number;
    payment_method: string;
    issuer_iban: string;
    pdf_url: string | null;
    sent_at: string | null;
    sent_by_user: string | null;
    created_at: string;
    updated_at: string;
};

export type RecibosTableRow = {
    id: string;
    recibo_number: number;
    atleta_nome: string;
    atleta_id: string;
    amount: number;
    mensalidade_mes: number;
    mensalidade_ano: number;
    data_pagamento: string | null;
    status: ReciboStatus;
    pdf_url: string | null;
    recibo_created_by: string | null;
    mensalidade_id: string;
};

// ========================================
// Atleta Types
// ========================================
export type Atleta = {
    id: number;
    nome: string;
    sobrenome: string;
    data_nascimento: string | Date;
    morada: string | null;
    telemovel: string | null;
    email: string;
    foto_perfil_url: string | null;
    peso_kg: number | null;
    altura_cm: number | null;
    nif: string;
    estado: "Ativo" | "Inativo" | "Pendente";
    created_at: string;
    updated_at: string;
};

export type AtletaState = {
    errors: {
        nome?: string[];
        sobrenome?: string[];
        data_nascimento?: string[];
        morada?: string[];
        telemovel?: string[];
        email?: string[];
        peso_kg?: string[];
        altura_cm?: string[];
        nif?: string[];
        foto_perfil?: string[];
    };
    message: string | null;
};

// ========================================
// Presidente Types
// ========================================
export type PresidentePerfil = {
    id: string;
    name: string;
    email: string;
    image_url: string;
    role: "admin" | "user";
    organization_id: string;
    iban: string | null;
    organization?: Organization;
};
