export type ReceiptActivity = {
    code: string;
    label: string;
};

// Subset of official CIRS activity table. Extend this list as needed.
export const RECEIPT_ACTIVITIES: ReceiptActivity[] = [
    { code: "1001", label: "Arquitectos" },
    { code: "1002", label: "Desenhadores" },
    { code: "1003", label: "Engenheiros" },
    { code: "1004", label: "Engenheiros tecnicos" },
    { code: "1005", label: "Geologos" },
    { code: "1006", label: "Topografos" },
    {
        code: "2010",
        label: "Artistas de teatro, bailado, cinema, radio e televisao",
    },
    { code: "2013", label: "Musicos" },
    { code: "2014", label: "Pintores" },
    { code: "4012", label: "Consultores fiscais" },
    { code: "4013", label: "Contabilistas" },
    { code: "4014", label: "Economistas" },
    { code: "5012", label: "Fisioterapeutas" },
    { code: "5013", label: "Nutricionistas" },
    { code: "6010", label: "Advogados" },
    { code: "7014", label: "Medicos de clinica geral" },
    { code: "8011", label: "Formadores" },
    { code: "8012", label: "Professores" },
    { code: "1010", label: "Psicologos" },
    { code: "1313", label: "Analistas de sistemas" },
    { code: "1332", label: "Programadores informaticos" },
    { code: "1336", label: "Designers" },
    { code: "1410", label: "Veterinarios" },
    { code: "1519", label: "Outros prestadores de servicos" },
];
