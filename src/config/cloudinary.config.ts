import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { APP_CONFIG } from "../env";

/**
 * Initializes Cloudinary configuration using environment variables.
 * Exits the process if connection fails.
 */
export const connectToCloudinaryCloudService = async () => {
  try {
    cloudinary.config({
      cloud_name: APP_CONFIG.CLOUDINARY_CLOUD_NAME,
      api_key: APP_CONFIG.CLOUDINARY_API_KEY,
      api_secret: APP_CONFIG.CLOUDINARY_API_SECRET,
      secure: true,
    });
    console.log("Cloudinary Connected");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

/**
 * Uploads an image file from the given file path to Cloudinary.
 * @param filePath - The local path to the image file.
 * @returns A promise that resolves to the Cloudinary upload response.
 */
export const uploadImageToCloudinary = async (filePath: string): Promise<UploadApiResponse> => {
  try {
    return await cloudinary.uploader.upload(filePath, {
      folder: "inn-assignment/user-images",
      resource_type: "image",
      use_filename: true,
      unique_filename: true,
    });
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    throw error;
  }
};

/**
 * Uploads an pdf file from the given file path to Cloudinary.
 * @param filePath - The local path to the image file.
 * @returns A promise that resolves to the Cloudinary upload response.
 *
 * Note: The option `type: "authenticated"` is set to restrict file access to authenticated requests only,
 * making the uploaded PDFs private and not publicly accessible by default.
 */
export const uploadPdfToCloudinary = async (filePath: string): Promise<UploadApiResponse> => {
  try {
    return await cloudinary.uploader.upload(filePath, {
      folder: "inn-assignment/user_pdfs",
      resource_type: "auto",
      use_filename: true,
      unique_filename: false,
      type: "authenticated",
      sign_url: true,
      secure: true,
    });
  } catch (error) {
    console.error("Error uploading PDF to Cloudinary:", error);
    throw error;
  }
};

/**
 * Uploads an filebuffer from the given filebuffer to Cloudinary.
 * @param fileBuffer
 * @param folder
 * @param originalname
 * @returns A promise that resolves to the Cloudinary upload response.
 */
export const uploadFileBufferToCloudinary = async (fileBuffer: Buffer, folder: string, originalname: string): Promise<UploadApiResponse> => {
  const filenameWithoutExt = originalname.replace(/\.[^/.]+$/, "");
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "auto",
          folder: folder,
          use_filename: true,
          public_id: filenameWithoutExt,
          unique_filename: false,
          type: "upload",
          sign_url: true,
          secure: true,
        },
        (error, result) => {
          if (error) return reject(error);
          if (result) return resolve(result);
          reject("Unknown error");
        }
      )
      .end(fileBuffer);
  });
};
