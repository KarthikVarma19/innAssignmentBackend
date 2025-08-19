import { join } from "path";
import { renderFile } from "ejs";
import puppeteer from "puppeteer";
import { IHelperIdCardData } from "../interfaces/idcard.interface";

export async function generatePdf(userData: IHelperIdCardData): Promise<Buffer> {
  const filePath = join(__dirname, "../views/helperIdCard.ejs");

  const html = await renderFile(filePath, { user: userData });

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "domcontentloaded" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();
  return Buffer.from(pdfBuffer);
}
