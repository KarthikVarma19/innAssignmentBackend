import { supabase } from "../config/supabase.config";

export const SupabaseService = {
  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    file: Express.Multer.File,
    originalname: string,
    mimetype: string,
    bucketName: string,
    folder: string
  ): Promise<string> {
    const filePath = folder ? `${folder}/${originalname}` : originalname;

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file.buffer, { upsert: true, contentType: mimetype });

    if (error) throw new Error(`Supabase upload failed: ${error.message}`);

    return this.getPublicUrl(bucketName, filePath);
  },

  /**
   * Get a public URL for a file
   */
  getPublicUrl(bucketName: string, filePath: string): string {
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    console.log(data.publicUrl);
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
