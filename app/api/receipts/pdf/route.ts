import { generateReceiptPdf, type ReceiptPdfData } from "@/app/lib/receipt-pdf";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        console.log("🔵 PDF route START");

        const data: ReceiptPdfData = await request.json();
        console.log("🔵 Received PDF data for receipt:", data.receiptNumber);

        const pdfBuffer = await generateReceiptPdf(data);

        console.log("🟢 PDF generated in route:", {
            size: pdfBuffer.length,
            isBuffer: Buffer.isBuffer(pdfBuffer),
            firstBytes: pdfBuffer.slice(0, 4).toString("hex"),
            firstBytesStr: pdfBuffer.slice(0, 20).toString(),
            receiptNumber: data.receiptNumber,
        });

        if (pdfBuffer.length === 0) {
            throw new Error("Generated PDF is empty");
        }

        // Verify PDF signature
        const signature = pdfBuffer.slice(0, 4).toString("hex");
        if (signature !== "25504446") {
            // %PDF in hex
            console.error("❌ INVALID PDF SIGNATURE!", {
                expected: "25504446",
                got: signature,
                content: pdfBuffer.slice(0, 100).toString(),
            });
        }

        console.log(
            "🔵 Sending response with Content-Length:",
            pdfBuffer.length,
        );

        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Length": pdfBuffer.length.toString(),
                "Content-Disposition": `attachment; filename="${data.receiptNumber}.pdf"`,
            },
        });
    } catch (error) {
        console.error("❌ PDF generation error:", error);
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: "Failed to generate PDF", details: errorMessage },
            { status: 500 },
        );
    }
}
