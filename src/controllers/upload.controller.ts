import { uploadPdf, uploadImage } from "../config/cloudinary.config";
import fs from "fs";
import { Request as ExpressRequest, Response as ExpressResponse } from "express";

export const uploadImageHandler = async (
  req: ExpressRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const result = await uploadImage(req.file.path);
    fs.unlinkSync(req.file.path);
    res.json({ success: true, url: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const uploadPdfHandler = async (
  req: ExpressRequest,
  res: ExpressResponse
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const result = await uploadPdf(req.file.path);
    fs.unlinkSync(req.file.path);
    console.log();
    res.json({ success: true, url: result.secure_url, result: result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
