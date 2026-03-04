"use server";

import React from "react";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    renderToBuffer,
} from "@react-pdf/renderer";
import { formatCurrencyPTBR } from "./utils";

export type ReceiptPdfData = {
    receiptNumber: number;
    issueDate: string;
    receivedDate: string;
    issuer: {
        name: string;
        email: string;
        iban: string;
    };
    customer: {
        name: string;
        nif: string | null;
        endereco_fiscal: string | null;
    };
    invoice: {
        id: string;
        amount: number;
        date: string;
    };
    fiscal: {
        activityCode: string;
        taxRegime: string;
        irsWithholding: string;
    };
};

const styles = StyleSheet.create({
    page: {
        padding: 48,
        fontSize: 11,
        fontFamily: "Helvetica",
        lineHeight: 1.6,
    },
    title: {
        fontSize: 18,
        textAlign: "center",
        marginBottom: 6,
    },
    receiptNumber: {
        fontSize: 12,
        textAlign: "center",
        marginBottom: 12,
    },
    section: {
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        borderBottomWidth: 1,
        paddingBottom: 4,
        marginBottom: 6,
    },
    row: {
        marginBottom: 4,
    },
    label: {
        fontSize: 10,
    },
    spacer: {
        marginBottom: 12,
    },
    largeSpacer: {
        marginBottom: 24,
    },
});

interface ReceiptDocumentProps {
    data: ReceiptPdfData;
}

const ReceiptDocument: React.FC<ReceiptDocumentProps> = ({ data }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <Text style={styles.title}>Recibo</Text>
            <Text style={styles.receiptNumber}>
                Numero: {data.receiptNumber}
            </Text>

            <View style={styles.section}>
                <Text style={styles.row}>
                    Data de emissao: {data.issueDate}
                </Text>
                <Text style={styles.row}>
                    Data de recebimento: {data.receivedDate}
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dados do emissor</Text>
                <Text style={styles.row}>Nome: {data.issuer.name}</Text>
                <Text style={styles.row}>Email: {data.issuer.email}</Text>
                <Text style={styles.row}>IBAN: {data.issuer.iban}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dados do cliente</Text>
                <Text style={styles.row}>
                    Nome ou Razao Social: {data.customer.name}
                </Text>
                <Text style={styles.row}>
                    NIF/NIPC: {data.customer.nif ?? "-"}
                </Text>
                <Text style={styles.row}>
                    Morada: {data.customer.endereco_fiscal ?? "-"}
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dados da fatura</Text>
                <Text style={styles.row}>Referencia: {data.invoice.id}</Text>
                <Text style={styles.row}>Data: {data.invoice.date}</Text>
                <Text style={styles.row}>
                    Valor recebido: {formatCurrencyPTBR(data.invoice.amount)}
                </Text>
                <Text style={styles.row}>
                    Metodo de pagamento: Transferencia bancaria
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dados fiscais</Text>
                <Text style={styles.row}>
                    Atividade exercida: {data.fiscal.activityCode}
                </Text>
                <Text style={styles.row}>
                    Regime de IVA: {data.fiscal.taxRegime}
                </Text>
                <Text style={styles.row}>
                    Retencao na fonte (IRS): {data.fiscal.irsWithholding}
                </Text>
            </View>

            <View style={styles.largeSpacer} />

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Assinatura</Text>
                <Text style={{ marginTop: 20 }}>{data.issuer.name}</Text>
            </View>
        </Page>
    </Document>
);

export async function generateReceiptPdf(
    data: ReceiptPdfData,
): Promise<Buffer> {
    try {
        console.log("🎨 Gerando PDF para recibo #" + data.receiptNumber);
        const buffer = await renderToBuffer(<ReceiptDocument data={data} />);
        console.log(
            "✅ PDF gerado com sucesso, tamanho:",
            buffer.length,
            "bytes",
        );
        return Buffer.from(buffer);
    } catch (error) {
        console.error("❌ Erro ao gerar PDF:", error);
        throw error;
    }
}
