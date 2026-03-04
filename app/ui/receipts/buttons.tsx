import Link from "next/link";
import {
    ArrowDownTrayIcon,
    PaperAirplaneIcon,
    EyeIcon,
} from "@heroicons/react/24/outline";
import { isUserAdmin, getCurrentUser } from "@/app/lib/auth-helpers";
import { sendReceiptAction } from "@/app/lib/receipt-actions";

export async function ReceiptActions({
    receiptId,
    receiptCreatedBy,
    status,
    pdfUrl,
}: {
    receiptId: string;
    receiptCreatedBy: string | null;
    status: "pending_send" | "sent_to_customer";
    pdfUrl: string | null;
}) {
    const isAdmin = await isUserAdmin();
    const currentUser = await getCurrentUser();
    const canSend =
        isAdmin || (currentUser && currentUser.id === receiptCreatedBy);

    const sendWithId = sendReceiptAction.bind(null, receiptId);

    return (
        <div className="flex items-center justify-end gap-2">
            <Link
                href={`/dashboard/receipts/${receiptId}`}
                className="rounded-lg border border-gray-700 p-2 hover:bg-gray-800 hover:border-gray-600 transition-all group"
                title="Rever"
            >
                <EyeIcon className="w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
            </Link>

            {pdfUrl ? (
                <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-gray-700 p-2 hover:bg-gray-800 hover:border-gray-600 transition-all group"
                    title="Download PDF"
                >
                    <ArrowDownTrayIcon className="w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                </a>
            ) : null}

            {canSend && status === "pending_send" ? (
                <form action={sendWithId}>
                    <button
                        type="submit"
                        className="rounded-lg border border-gray-700 p-2 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all group"
                        title="Enviar recibo"
                    >
                        <PaperAirplaneIcon className="w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                    </button>
                </form>
            ) : null}
        </div>
    );
}
