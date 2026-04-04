import { generateReciboPdf, type ReciboPdfData } from "@/app/lib/receipt-pdf";
import { requireApiAccountType } from "@/app/lib/api-guards";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const access = await requireApiAccountType();
        if (!access.ok) {
            return NextResponse.json(
                { error: access.error },
                { status: access.status },
            );
        }

        const data: ReciboPdfData = await request.json();

        const pdfBuffer = await generateReciboPdf(data);

        if (pdfBuffer.length === 0) {
            throw new Error("Generated PDF is empty");
        }

        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Length": pdfBuffer.length.toString(),
                "Content-Disposition": `attachment; filename="recibo-${data.reciboNumber}.pdf"`,
            },
        });
    } catch (error) {
        console.error("PDF generation error:", error);
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: "Failed to generate PDF", details: errorMessage },
            { status: 500 },
        );
    }
}
