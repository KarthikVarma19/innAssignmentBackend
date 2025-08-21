import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

export async function compressImageBufferToBuffer(fileBuffer: Buffer, quality = 70): Promise<Buffer> {
  try {
    const compressedBuffer = await sharp(fileBuffer).jpeg({ quality }).toBuffer();
    return compressedBuffer;
  } catch (error) {
    console.error("Error compressing image:", error);
    throw error;
  }
}

export async function compressPdfBufferToBuffer(pdfBuffer: Buffer): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const compressedPdfBytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
  return Buffer.from(compressedPdfBytes);
}
