import { join } from "path";
import { renderFile } from "ejs";
import puppeteer from "puppeteer";

interface UserData {
  name: string;
  photoUrl: string;
  id: string;
  [key: string]: any;
}

export async function generatePdf(userData: UserData): Promise<Buffer> {
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
