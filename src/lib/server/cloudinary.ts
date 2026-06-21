import "server-only";

import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

let configured = false;

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} belum dikonfigurasi.`);
  }

  return value;
}

function getCloudinary() {
  if (!configured) {
    cloudinary.config({
      cloud_name: getRequiredEnv("CLOUDINARY_CLOUD_NAME"),
      api_key: getRequiredEnv("CLOUDINARY_API_KEY"),
      api_secret: getRequiredEnv("CLOUDINARY_API_SECRET"),
      secure: true,
    });
    configured = true;
  }

  return cloudinary;
}

export async function uploadImageBuffer({
  buffer,
  folder,
  fileName,
}: {
  buffer: Buffer;
  folder: string;
  fileName: string;
}) {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = getCloudinary().uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        use_filename: true,
        filename_override: fileName,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Upload Cloudinary gagal."));
          return;
        }

        resolve(result);
      },
    );

    stream.end(buffer);
  });
}

export function buildCloudinaryThumbnail(publicId: string) {
  return getCloudinary().url(publicId, {
    width: 500,
    crop: "limit",
    fetch_format: "auto",
    quality: "auto",
    secure: true,
  });
}
