CREATE TABLE IF NOT EXISTS clubes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    presidente_user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    modalidade TEXT NOT NULL,
    iban TEXT,
    nipc TEXT,
    website TEXT,
    telefone TEXT,
    codigo_postal TEXT,
    morada TEXT,
    cidade TEXT,
    pais TEXT NOT NULL DEFAULT 'Portugal',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clubes_organization_id
    ON clubes (organization_id);
