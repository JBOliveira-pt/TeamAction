import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

// Initialize R2 client
const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

/**
 * Upload an image to R2
 * @param file - The file to upload
 * @param entityType - "customer" or "user"
 * @param entityId - The entity's ID
 * @returns The public URL of the uploaded image
 */

export async function uploadImageToR2(
    file: File,
    entityType: "customer" | "user",
    entityId: string,
): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = file.name.split(".").pop() || "png";
    const uniqueSuffix = `${Date.now()}-${crypto.randomUUID()}`;
    const key = `${entityType}/${entityId}/${uniqueSuffix}.${fileExtension}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type || "image/png",
        CacheControl: "public, max-age=31536000", // 1 year
    });

    await r2Client.send(command);

    // Return public URL
    return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * Delete an image from R2
 * @param imageUrl - The full URL of the image to delete
 */

export async function deleteImageFromR2(imageUrl: string): Promise<void> {
    const key = imageUrl.replace(`${R2_PUBLIC_URL}/`, "");

    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    await r2Client.send(command);
}

/**
 * Generate a signed URL for private images
 */
export async function getSignedImageUrl(
    key: string,
    expiresIn: number = 3600,
): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    return await getSignedUrl(r2Client, command, { expiresIn });
}

export async function uploadReceiptPdfToR2(
    buffer: Buffer,
    receiptId: string,
    receiptNumber: number,
): Promise<string> {
    const safeNumber = String(receiptNumber).padStart(8, "0");
    const key = `receipts/${receiptId}/recibo-${safeNumber}.pdf`;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: "application/pdf",
        CacheControl: "private, max-age=0, must-revalidate",
    });

    await r2Client.send(command);

    return `${R2_PUBLIC_URL}/${key}`;
}
