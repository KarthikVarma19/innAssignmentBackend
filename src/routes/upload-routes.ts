import express, { Router, Response } from "express";
import { uploadPdfHandler, uploadImageHandler } from '../controllers/upload-controller';
import { upload } from '../config/multer-config';
import multer from "multer";

const uploadRouter = Router();

import type { Request } from "express";
import { uploadToCloudinary, uploadImage, uploadPdf } from "../config/cloud-uploads";



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
    {name: "additionalDocuments", maxCount: 1000},
    { name: "images", maxCount: 5 },
    { name: "pdfs", maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      // Ensure req.files is defined and has the expected structure
      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      } || {};

      // NOTE: The field names in the frontend form-data must be "images" and "pdfs"
      // For example, use <input type="file" name="images" multiple> and <input type="file" name="pdfs" multiple>

      const imageFiles = Array.isArray(files.images) ? files.images : [];
      const pdfFiles = Array.isArray(files.pdfs) ? files.pdfs : [];


      const profilePicFiles = Array.isArray(files.profilePic) ? files.profilePic : [];

      const kycDocumentFiles = Array.isArray(files.kycDocument) ? files.kycDocument : [];


      // profile pics images'
      const profilePicLinks = await Promise.all(
        profilePicFiles.map((file) =>
          uploadToCloudinary(file.buffer, "images", file.originalname)
        )
      );

      // kyc documents pdfs'
      const kycDocumentLinks = await Promise.all(
        kycDocumentFiles.map((file) =>
          uploadToCloudinary(file.buffer, "pdfs", file.originalname)
        )
      );

      // any other image links
      const imageLinks = await Promise.all(
        imageFiles.map((file) => uploadToCloudinary(file.buffer, "images", file.originalname))
      );

      // any other pdf links needed
      const pdfLinks = await Promise.all(
        pdfFiles.map((file) => uploadToCloudinary(file.buffer, "pdfs", file.originalname))
      );

      


      return res.json({
        message: "Files uploaded successfully",
        uploaded: {
          profilePic: profilePicLinks[0],
          kycDocument: kycDocumentLinks[0],
          profilePics: profilePicLinks,     
          kycDocuments: kycDocumentLinks,   
          otherImages: imageLinks,         
          otherPdfs: pdfLinks
        }
      }
      );

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Upload failed", error: err });
    }
  }
);

export default uploadRouter;
