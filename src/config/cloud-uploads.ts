import { v2 as cloudinary } from "cloudinary";
import { config } from "../env";

// Return "https" URLs by setting secure: true


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
}


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
    resource_type: "raw",
    use_filename: true,
    unique_filename: true,
  });
};



export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder }, (error, result) => {
        if (error) return reject(error);
        if (result?.secure_url) return resolve(result.secure_url);
        reject("Unknown error");
      })
      .end(fileBuffer);
  });
};






