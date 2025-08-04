import express, { Router, Response } from "express";
import { uploadPdfHandler, uploadImageHandler } from '../controllers/upload-controller';
import { upload } from '../config/multer-config';

const uploadRouter = Router();

import type { Request } from "express";
import { uploadToCloudinary } from "../config/cloud-uploads";



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

uploadRouter.post(
  "/upload/multiple",
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "pdfs", maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      const imageFiles = files?.images || [];
      const pdfFiles = files?.pdfs || [];

      const imageLinks = await Promise.all(
        imageFiles.map((file) => uploadToCloudinary(file.buffer, "images"))
      );

      const pdfLinks = await Promise.all(
        pdfFiles.map((file) => uploadToCloudinary(file.buffer, "pdfs"))
      );

      return res.json({
        message: "Files uploaded successfully",
        imageLinks,
        pdfLinks,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Upload failed", error: err });
    }
  }
);

export default uploadRouter;
