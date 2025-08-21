import { supabase } from "../config/supabase.config";

interface UploadedFile {
  buffer: Buffer;
}

export const SupabaseService = {
  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(file: UploadedFile, originalname: string, mimetype: string, bucketName: string, folder: string): Promise<string> {
    const filePath = folder ? `${folder}/${originalname}` : originalname;

    const { error } = await supabase.storage.from(bucketName).upload(filePath, file.buffer, { contentType: mimetype, upsert: true });

    if (error) throw new Error(`Supabase upload failed: ${error.message}`);

    return this.getPublicUrl(bucketName, filePath);
  },

  /**
   * Upload filebuffer to Supabase Storage
   */
  async uploadFileBuffer(fileBuffer: Buffer, fileName: string, mimeType: string, bucketName: string, folderName: string): Promise<string> {
    const filePath = `${folderName}/${fileName}`;

    const { error } = await supabase.storage.from(bucketName).upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

    if (error) throw error;

    return this.getPublicUrl(bucketName, filePath);
  },

  /**
   * Get a public URL for a file From Supabase Storage
   */
  getPublicUrl(bucketName: string, filePath: string): string {
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return data.publicUrl;
  },

  /**
   * Delete multiple files from Supabase Storage
   */
  async deleteFiles(bucketName: string, filePaths: string[]): Promise<void> {
    if (!filePaths?.length) throw new Error("File paths array is empty");

    const { error } = await supabase.storage.from(bucketName).remove(filePaths);

    if (error) throw new Error(`Failed to delete files: ${error.message}`);
  },
};
