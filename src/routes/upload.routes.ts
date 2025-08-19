import { Router } from "express";
import { uploadPdfHandler, uploadImageHandler, uploadMultipleFilesHandler } from "../controllers/upload.controller";
import { upload } from "../config/multer.config";
import multer from "multer";
const memoryUpload = multer({ storage: multer.memoryStorage() });

const uploadRouter = Router();

uploadRouter.post("/image", upload.single("file"), uploadImageHandler);
uploadRouter.post("/pdf", upload.single("file"), uploadPdfHandler);
uploadRouter.post(
  "/multiple",
  memoryUpload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "kycDocument", maxCount: 1 },
    { name: "additionalDocuments", maxCount: 10 },
  ]),
  uploadMultipleFilesHandler
);

export default uploadRouter;
