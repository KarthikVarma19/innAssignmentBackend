import { v2 as cloudinary } from "cloudinary";
import { config } from "../env";

export const connectCloudinary = async () => {
  try {
    cloudinary.config({
      cloud_name: config.CLOUDINARY_CLOUD_NAME,
      api_key: config.CLOUDINARY_API_KEY,
      api_secret: config.CLOUDINARY_API_SECRET,
      secure: true,
    });
    console.log("Cloudinary Connected");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

export const uploadImage = async (filePath: string) => {
  return await cloudinary.uploader.upload(filePath, {
    folder: "inn-assignment/user-images",
    resource_type: "image",
    use_filename: true,
    unique_filename: true,
  });
};

export const uploadPdf = async (filePath: string) => {
  return await cloudinary.uploader.upload(filePath, {
    folder: "inn-assignment/user_pdfs",
    resource_type: "auto",
    use_filename: true,
    unique_filename: true,
    type: "authenticated",
    sign_url: true,
    secure: true,
  });
};

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string,
  originalname: string
): Promise<string> => {
  const filenameWithoutExt = originalname.replace(/\.[^/.]+$/, "");
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "auto",
          folder: folder,
          use_filename: true,
          public_id: filenameWithoutExt,
          type: "upload",
          sign_url: true,
          secure: true,
        },
        (error, result) => {
          if (error) return reject(error);
          if (result?.secure_url) return resolve(result?.secure_url);
          reject("Unknown error");
        }
      )
      .end(fileBuffer);
  });
};
