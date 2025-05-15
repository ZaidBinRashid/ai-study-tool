// controller/pdfController.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function uploadPdfHandler(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file provided" });
  }

  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const savedPdf = await prisma.pdf.create({
      data: {
        fileName: req.file.filename,
        fileUrl: req.file.path.replace(/\\/g, "/"), // normalize Windows paths
        userId,
      },
    });

    res.status(201).json({
      message: "PDF uploaded successfully",
      pdf: savedPdf,
    });
  } catch (err) {
    console.error("Error saving PDF to database:", err);
    res.status(500).json({ error: "Database error occurred" });
  }
}
