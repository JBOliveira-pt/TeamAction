import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { uploadImageToR2, deleteImageFromR2 } from "@/app/lib/r2-storage";
import { sql } from "@/app/lib/actions/_shared";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: Request) {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
        return NextResponse.json(
            { error: "Não autenticado." },
            { status: 401 },
        );
    }

    try {
        const formData = await request.formData();
        const file = formData.get("avatar") as File | null;

        if (!file || !(file instanceof File)) {
            return NextResponse.json(
                { error: "Nenhum ficheiro enviado." },
                { status: 400 },
            );
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Formato não suportado. Use JPEG, PNG, WebP ou GIF." },
                { status: 400 },
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "Ficheiro demasiado grande. Máximo 5 MB." },
                { status: 400 },
            );
        }

        // Fetch current user to get existing image_url
        const [user] = await sql<{ id: string; image_url: string | null }[]>`
            SELECT id, image_url FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
        `;
        if (!user) {
            return NextResponse.json(
                { error: "Utilizador não encontrado." },
                { status: 404 },
            );
        }

        // Delete old R2 image if it's not a Clerk URL
        if (user.image_url && !user.image_url.includes("img.clerk.com")) {
            try {
                await deleteImageFromR2(user.image_url);
            } catch {
                // Ignore deletion errors for old images
            }
        }

        // Upload new avatar to R2
        const imageUrl = await uploadImageToR2(file, "user", user.id);

        // Update DB
        await sql`
            UPDATE users SET image_url = ${imageUrl}, updated_at = NOW()
            WHERE clerk_user_id = ${clerkUserId}
        `;

        return NextResponse.json({ imageUrl });
    } catch (error) {
        console.error("Avatar upload error:", error);
        return NextResponse.json(
            { error: "Erro ao fazer upload da imagem." },
            { status: 500 },
        );
    }
}
