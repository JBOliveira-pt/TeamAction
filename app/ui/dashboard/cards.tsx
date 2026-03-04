// app/ui/dashboard/cards.tsx
import { fetchCardData } from "@/app/lib/data";
import {
    TrendingUp,
    TrendingDown,
    Users,
    FileText,
    DollarSign,
    Clock,
    ReceiptText,
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/app/components/card";

// Função para formatar valores monetários
function formatCurrency(value: string | number): string {
    // Se for string com $, remove e converte
    if (typeof value === "string") {
        const numValue = parseFloat(value.replace(/[^0-9.-]+/g, ""));
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "EUR",
        }).format(numValue || 0);
    }
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "EUR",
    }).format(value);
}

export default async function CardWrapper() {
    const {
        numberOfCustomers,
        numberOfInvoices,
        numberOfReceipts,
        totalPaidInvoices,
        totalPendingInvoices,
        numberOfPendingInvoices,
        percentPaidChange,
        percentCustomersChange,
        customersChange,
    } = await fetchCardData();

    return (
        <>
            {/* Card 1 - Receitas Coletadas */}
            <Card className="text-gray-900 dark:text-white bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-600/20 dark:to-emerald-600/20 border-green-300 dark:border-green-800/50 col-span-2 lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xs text-green-700 dark:text-green-200">
                        RECEBIDO
                    </CardTitle>

                    <div className="p-1.5 bg-green-500/10 rounded-lg">
                        <DollarSign className="text-green-500 w-4 h-4" />
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="text-xl lg:text-2xl font-bold text-green-900 dark:text-green-100">
                        {formatCurrency(totalPaidInvoices)}
                    </div>

                    <div className="flex items-center gap-1 mt-2">
                        <TrendingUp className="text-green-500 w-3 h-3" />
                        <span className="text-xs text-green-600 dark:text-green-400">
                            {percentPaidChange > 0
                                ? `+${percentPaidChange.toFixed(2)}%`
                                : `${percentPaidChange.toFixed(2)}%`}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Card 2 - Valores Pendentes */}
            <Card className="text-gray-900 dark:text-white hover:border-yellow-600 dark:hover:border-yellow-800/50 transition-all duration-200 col-span-1">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xs">PENDENTE</CardTitle>
                    <div className="p-1.5 bg-yellow-500/10 rounded-lg">
                        <Clock className="text-yellow-500 w-4 h-4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-xl lg:text-2xl font-bold">
                        {formatCurrency(totalPendingInvoices)}
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-yellow-500">
                            {numberOfPendingInvoices === 0
                                ? "Nenhuma fatura pendente"
                                : numberOfPendingInvoices === 1
                                  ? "1 fatura pendente"
                                  : `${numberOfPendingInvoices} faturas pendentes`}
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Card 3 - Total de Faturas */}
            <Card className="text-gray-900 dark:text-white hover:border-blue-600 dark:hover:border-blue-800/50 transition-all duration-200 col-span-1">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xs">FATURAS</CardTitle>
                    <div className="p-1.5 bg-blue-500/10 rounded-lg">
                        <FileText className="text-blue-500 w-4 h-4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-xl lg:text-2xl font-bold">
                        {numberOfInvoices}
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                            Total
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Card 4 - Total de Recibos */}
            <Card className="text-gray-900 dark:text-white hover:border-teal-600 dark:hover:border-teal-800/50 transition-all duration-200 col-span-1">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xs">RECIBOS</CardTitle>
                    <div className="p-1.5 bg-teal-500/10 rounded-lg">
                        <ReceiptText className="text-teal-500 w-4 h-4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-xl lg:text-2xl font-bold">
                        {numberOfReceipts}
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                            Total
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Card 5 - Total de Clientes */}
            <Card className="text-gray-900 dark:text-white hover:border-purple-600 dark:hover:border-purple-800/50 transition-all duration-200 col-span-1">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xs">CLIENTES</CardTitle>
                    <div className="p-1.5 bg-purple-500/10 rounded-lg">
                        <Users className="text-purple-500 dark:text-purple-400 w-4 h-4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-xl lg:text-2xl font-bold">
                        {numberOfCustomers}
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                        {customersChange > 0 ? (
                            <TrendingUp className="text-purple-500 dark:text-purple-400 w-3 h-3" />
                        ) : customersChange < 0 ? (
                            <TrendingDown className="text-purple-500 dark:text-purple-400 w-3 h-3" />
                        ) : null}
                        <span className="text-xs text-purple-500 dark:text-purple-400">
                            {customersChange > 0
                                ? `+${customersChange}`
                                : customersChange < 0
                                  ? customersChange
                                  : "0"}{" "}
                            {Math.abs(customersChange) === 1
                                ? "cliente"
                                : "clientes"}{" "}
                            no último mês
                        </span>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
