import { Request, Response } from "express";
import { generatePdf } from "../utils/pdf-generator";


export const downloadIdCard = async (req: Request, res: Response) => {
  const userData = req.body;

  try {
    const pdf = await generatePdf(userData);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="id-card.pdf"',
    });
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate ID card" });
  }
};
