import fs from "fs";
import { Request as ExpressRequest, Response as ExpressResponse } from "express";

import { uploadPdfToCloudinary, uploadImageToCloudinary, uploadFileBufferToCloudinary } from "../config/cloudinary.config";
import { SupabaseService } from "../services/supabase.service";
import { APP_CONFIG } from "../env";
import { compressImageBufferToBuffer, compressPdfBufferToBuffer } from "../utils/file-compressor";

// Uploads Image to Cloudinary
export const uploadImageHandler = async (req: ExpressRequest, res: ExpressResponse): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const result = await uploadImageToCloudinary(req.file.path);
    fs.unlinkSync(req.file.path);
    res.json({ success: true, url: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

// Uploads Pdf to Cloudinary
export const uploadPdfHandler = async (req: ExpressRequest, res: ExpressResponse): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const result = await uploadPdfToCloudinary(req.file.path);
    fs.unlinkSync(req.file.path);
    res.json({ success: true, url: result.secure_url, result: result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

// Uploads All Pdf's To Supabase and All Image's to Cloudinary
export const uploadMultipleFilesHandler = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    // Ensure req.files is defined and has the expected structure
    const files = (req.files as { [fieldname: string]: Express.Multer.File[] }) || {};
    let profilePicFile: Express.Multer.File | undefined;
    let kycDocumentFile: Express.Multer.File | undefined;

    let additionalDocumentFiles: Express.Multer.File[] = [];

    if (files.profilePic && files.profilePic.length > 0) {
      profilePicFile = files.profilePic[0];
    }

    if (files.kycDocument && files.kycDocument.length > 0) {
      kycDocumentFile = files.kycDocument[0];
    }

    if (files.additionalDocuments && files.additionalDocuments.length > 0) {
      additionalDocumentFiles = files.additionalDocuments;
    }

    // Compress profilePicFile if it exists
    if (profilePicFile) {
      profilePicFile.buffer = await compressImageBufferToBuffer(profilePicFile.buffer);
    }

    // Compress kycDocumentFile if it exists
    if (kycDocumentFile) {
      kycDocumentFile.buffer = await compressPdfBufferToBuffer(kycDocumentFile.buffer);
    }

    // Compress Additional Documents if it exits
    if (additionalDocumentFiles.length > 0) {
      for (const additionalDocumentFile of additionalDocumentFiles) {
        additionalDocumentFile.buffer = await compressPdfBufferToBuffer(additionalDocumentFile.buffer);
      }
    }

    let cloudinaryProfilePicUrl: string = "";
    if (profilePicFile) {
      const result = await uploadFileBufferToCloudinary(profilePicFile.buffer, APP_CONFIG.CLOUDINARY_CLOUD_PROFILEPICS_IMAGES_FOLDERNAME, profilePicFile.originalname);
      cloudinaryProfilePicUrl = result.secure_url;
    }
    // profile pics link

    let supabaseKYCDocumentUrl: string = "";
    // if not exists controll this

    if (kycDocumentFile) {
      supabaseKYCDocumentUrl = await SupabaseService.uploadFile(kycDocumentFile, kycDocumentFile.originalname, "application/pdf", APP_CONFIG.SUPABASE_BUCKET_NAME, APP_CONFIG.SUPABASE_HELPER_KYCDOCUMENTS_PDFS_FOLDERNAME);
    }

    const additionalDocumentUrls = await Promise.all(additionalDocumentFiles.map((additonalDocumentFile) => SupabaseService.uploadFile(additonalDocumentFile, additonalDocumentFile.originalname, "application/pdf", APP_CONFIG.SUPABASE_BUCKET_NAME, APP_CONFIG.SUPABASE_HELPER_ADDITIONAL_DOCUMENTS_PDFS_FOLDERNAME)));

    return res.json({
      message: "Files uploaded successfully",
      uploaded: {
        profilePic: cloudinaryProfilePicUrl,
        kycDocument: supabaseKYCDocumentUrl,
        additionalDocuments: additionalDocumentUrls,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed", error: err });
  }
};
