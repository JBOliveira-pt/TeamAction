import { generateReceiptPdf, type ReceiptPdfData } from "@/app/lib/receipt-pdf";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const data: ReceiptPdfData = await request.json();
        const pdfBuffer = await generateReceiptPdf(data);

        console.log("DEBUG: PDF generated:", {
            size: pdfBuffer.length,
            isBuffer: Buffer.isBuffer(pdfBuffer),
            firstBytes: pdfBuffer.slice(0, 4).toString("hex"),
            isPdfSignature: pdfBuffer.slice(0, 4).toString() === "%PDF",
        });

        if (pdfBuffer.length === 0) {
            return NextResponse.json(
                { error: "Generated PDF is empty" },
                { status: 400 },
            );
        }

        // Check if it's a valid PDF
        const pdfSignature = pdfBuffer.slice(0, 4).toString();
        if (!pdfSignature.includes("%PDF")) {
            console.warn(
                "WARNING: Generated buffer does not have PDF signature",
            );
        }

        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Length": pdfBuffer.length.toString(),
                "Content-Disposition": `attachment; filename="debug-${data.receiptNumber}.pdf"`,
            },
        });
    } catch (error) {
        console.error("DEBUG: PDF generation error:", error);
        return NextResponse.json(
            {
                error: "Failed to generate PDF",
                details: String(error),
                stack: error instanceof Error ? error.stack : undefined,
            },
            { status: 500 },
        );
    }
}
