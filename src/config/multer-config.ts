
import path from "path";
import { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import fs from "fs";

// Save files temporarily to disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "./uploads/";
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (_req, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});


const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedTypes = ["image/jpeg","image/jpg" ,"image/png", "image/*", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(null, false);
};

export const upload = multer({ storage, fileFilter });


