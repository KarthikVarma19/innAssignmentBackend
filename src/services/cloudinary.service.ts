import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

export class CloudinaryService {
  async uploadFile(fileBuffer: Buffer, folderName: string, fileName: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
            type: "upload",
            secure: true,
            use_filename: true,
            unique_filename: false,
            folder: folderName,
            public_id: fileName,
          },
          (error, result) => {
            if (error) return reject(error);
            if (result) return resolve(result);
            reject("Unknown error");
          }
        )
        .end(fileBuffer);
    });
  }

  async deleteFile(public_id: string, resource_type: string): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .destroy(public_id, {
          resource_type,
        })
        .then((result) => result)
        .catch((error) => console.error("Error in Deleting File", error));
    });
  }
}
