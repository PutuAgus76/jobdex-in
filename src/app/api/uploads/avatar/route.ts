import { NextResponse, type NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getServerAuthContext } from "@/lib/server/auth";
import { getAdminDb } from "@/lib/server/firebase-admin";

export const runtime = "nodejs";

// Configure Cloudinary from server-only env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    const { profile } = await getServerAuthContext(request);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
    }

    const blob = file as File;

    if (!ALLOWED_TYPES.includes(blob.type)) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Gunakan JPEG, PNG, atau WebP." },
        { status: 400 }
      );
    }

    if (blob.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File terlalu besar. Maksimal 5 MB." },
        { status: 400 }
      );
    }

    // Convert to base64 for Cloudinary upload
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUri = `data:${blob.type};base64,${base64}`;

    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: "jobdex-avatars",
      public_id: `avatar_${profile.id}`,
      overwrite: true,
      transformation: [
        { width: 256, height: 256, crop: "fill", gravity: "face" },
        { quality: "auto:good", fetch_format: "auto" },
      ],
    });

    const avatarUrl: string = uploadResult.secure_url;

    // Save to Firestore
    const db = getAdminDb();
    await db.collection("users").doc(profile.id).update({
      avatar_url: avatarUrl,
      updated_at: new Date(),
    });

    return NextResponse.json({ avatar_url: avatarUrl });
  } catch (error) {
    console.error("[Avatar Upload] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal mengupload foto profil.",
      },
      { status: 500 }
    );
  }
}
