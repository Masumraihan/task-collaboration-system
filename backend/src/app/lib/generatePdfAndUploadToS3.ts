import { PDFDocument } from "pdf-lib";
import puppeteer from "puppeteer";
import { uploadToS3 } from "../constant/s3";
interface UploadToS3Params {
  file: Uint8Array;
  fileName: string;
}

/**
 * Generate a PDF from an HTML string and upload it to S3.
 * @param htmlString - HTML string to generate the PDF.
 * @param s3FilePath - Path in the S3 bucket to store the PDF.
 * @returns Promise<string> - S3 URL of the uploaded PDF.
 */
export const generatePdfAndUploadToS3 = async (
  htmlString: string,
  s3FilePath: string,
): Promise<string | null> => {
  try {
    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1550, height: 1600 });
    await page.setContent(htmlString, { waitUntil: "networkidle0" });

    // Take a screenshot of the rendered HTML
    const screenshotBuffer = await page.screenshot({ fullPage: true, omitBackground: true });
    await browser.close();

    // Create a PDF with the screenshot
    const pdfDoc = await PDFDocument.create();
    const image = await pdfDoc.embedPng(screenshotBuffer);
    const page1 = pdfDoc.addPage([image.width, image.height]);
    page1.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });

    const pdfBytes = await pdfDoc.save();

    // Upload the PDF to S3
    const s3Url = await uploadToS3({ file: pdfBytes, fileName: s3FilePath });
    return s3Url;
  } catch (error) {
    console.error("Error generating and uploading PDF:", error);
    throw error;
  }
};
