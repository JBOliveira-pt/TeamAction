import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        status: "✅ Webhook endpoint is accessible",
        timestamp: new Date().toISOString(),
        message: "If you see this, ngrok tunneling is working correctly"
    });
}