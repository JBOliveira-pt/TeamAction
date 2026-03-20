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

const MESES_NOMES: Record<number, string> = {
    1: "Janeiro", 2: "Fevereiro", 3: "Marco", 4: "Abril",
    5: "Maio", 6: "Junho", 7: "Julho", 8: "Agosto",
    9: "Setembro", 10: "Outubro", 11: "Novembro", 12: "Dezembro",
};

export type ReciboPdfData = {
    reciboNumber: number;
    issueDate: string;
    receivedDate: string;
    clube: {
        nome: string;
        nipc: string | null;
        morada: string | null;
        cidade: string | null;
    };
    atleta: {
        nome: string;
    };
    mensalidade: {
        mes: number;
        ano: number;
        amount: number;
        dataPagamento: string | null;
    };
    issuerIban: string;
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
    reciboNumber: {
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

interface ReciboDocumentProps {
    data: ReciboPdfData;
}

const ReciboDocument: React.FC<ReciboDocumentProps> = ({ data }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <Text style={styles.title}>Recibo de Mensalidade</Text>
            <Text style={styles.reciboNumber}>
                Numero: {data.reciboNumber}
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
                <Text style={styles.sectionTitle}>Dados do clube (emissor)</Text>
                <Text style={styles.row}>Nome: {data.clube.nome}</Text>
                <Text style={styles.row}>NIPC: {data.clube.nipc ?? "-"}</Text>
                <Text style={styles.row}>Morada: {data.clube.morada ?? "-"}</Text>
                <Text style={styles.row}>Cidade: {data.clube.cidade ?? "-"}</Text>
                <Text style={styles.row}>IBAN: {data.issuerIban}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dados do atleta</Text>
                <Text style={styles.row}>
                    Nome: {data.atleta.nome}
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dados da mensalidade</Text>
                <Text style={styles.row}>
                    Periodo: {MESES_NOMES[data.mensalidade.mes] ?? data.mensalidade.mes} / {data.mensalidade.ano}
                </Text>
                <Text style={styles.row}>
                    Valor recebido: {formatCurrencyPTBR(data.mensalidade.amount)}
                </Text>
                <Text style={styles.row}>
                    Data de pagamento: {data.mensalidade.dataPagamento ?? "-"}
                </Text>
                <Text style={styles.row}>
                    Metodo de pagamento: Transferencia bancaria
                </Text>
            </View>

            <View style={styles.largeSpacer} />

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Assinatura</Text>
                <Text style={{ marginTop: 20 }}>{data.clube.nome}</Text>
            </View>
        </Page>
    </Document>
);

export async function generateReciboPdf(
    data: ReciboPdfData,
): Promise<Buffer> {
    try {
        console.log("Gerando PDF para recibo #" + data.reciboNumber);
        const buffer = await renderToBuffer(<ReciboDocument data={data} />);
        console.log("PDF gerado com sucesso, tamanho:", buffer.length, "bytes");
        return Buffer.from(buffer);
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        throw error;
    }
}
