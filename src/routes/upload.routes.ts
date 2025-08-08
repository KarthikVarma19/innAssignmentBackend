import express, { Router, Response } from "express";
import { uploadPdfHandler, uploadImageHandler } from "../controllers/upload.controller";
import { upload } from "../config/multer.config";
import multer from "multer";

const uploadRouter = Router();

import type { Request } from "express";
import { uploadToCloudinary, uploadImage, uploadPdf } from "../config/cloudinary.config";
import { SupabaseService } from "../services/supabase.service";
import { config } from "../env";
import { compressImageBufferToBuffer, compressPdfBufferToBuffer } from "../utils/file-compressor";

uploadRouter.post(
  "/image",
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    await uploadImageHandler(req, res);
  }
);

uploadRouter.post(
  "/pdf",
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    await uploadPdfHandler(req, res);
  }
);
const memoryUpload = multer({ storage: multer.memoryStorage() });

uploadRouter.post(
  "/multiple",
  memoryUpload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "kycDocument", maxCount: 1 },
    { name: "additionalDocuments", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      // Ensure req.files is defined and has the expected structure
      const files = (req.files as { [fieldname: string]: Express.Multer.File[] }) || {};
      let profilePicFile: Express.Multer.File | undefined;
      if (files.profilePic && files.profilePic.length > 0) {
        profilePicFile = files.profilePic[0];
      }
      const kycDocumentFile = files.kycDocument[0];
      const additionalDocumentFiles = Array.isArray(files.additionalDocuments)
        ? files.additionalDocuments
        : [];

      // Compress profilePicFile if it exists
      if (profilePicFile) {
        profilePicFile.buffer = await compressImageBufferToBuffer(profilePicFile.buffer);
      }

      // Compress kycDocumentFile
      if (kycDocumentFile) {
        kycDocumentFile.buffer = await compressPdfBufferToBuffer(kycDocumentFile.buffer);
      }

      // Compress each additionalDocumentFile
      for (const additonalDocumentFile of additionalDocumentFiles) {
        additonalDocumentFile.buffer = await compressPdfBufferToBuffer(
          additonalDocumentFile.buffer
        );
      }

      let cloudinaryProfilePicUrl: string = "";
      if (profilePicFile) {
        cloudinaryProfilePicUrl = await uploadToCloudinary(
          profilePicFile.buffer,
          config.CLOUDINARY_CLOUD_PROFILEPICS_IMAGES_FOLDERNAME,
          profilePicFile.originalname
        );
      }
      // profile pics link

      const supabaseKYCDocumentUrl = await SupabaseService.uploadFile(
        kycDocumentFile,
        kycDocumentFile.originalname,
        "application/pdf",
        config.SUPABASE_BUCKET_NAME,
        config.SUPABASE_HELPER_KYCDOCUMENTS_PDFS_FOLDERNAME
      );

      const additionalDocumentUrls = await Promise.all(
        additionalDocumentFiles.map((additonalDocumentFile) =>
          SupabaseService.uploadFile(
            additonalDocumentFile,
            additonalDocumentFile.originalname,
            "application/pdf",
            config.SUPABASE_BUCKET_NAME,
            config.SUPABASE_HELPER_ADDITIONAL_DOCUMENTS_PDFS_FOLDERNAME
          )
        )
      );

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
  }
);

export default uploadRouter;
