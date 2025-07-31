import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import 'dotenv/config';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Split a long string into roughly `maxChars`-sized chunks
function chunkify(text, maxChars = 8000) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(text.length, start + maxChars);
    // try to break on whitespace
    const lastSpace = text.lastIndexOf(' ', end);
    if (lastSpace > start) end = lastSpace;
    chunks.push(text.slice(start, end).trim());
    start = end;
  }
  return chunks;
}

// --- Save metadata, then pass on to next() ---
export async function uploadPdfHandler(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file provided' });
  }
  try {
    const savedPdf = await prisma.pdf.create({
      data: {
        fileName: req.file.originalname,
        fileUrl: req.file.path.replace(/\\/g, '/'),
        userId: req.user.id,
      },
    });
    req.savedPdf = savedPdf;
    next();
  } catch (err) {
    console.error('DB error saving PDF:', err);
    res.status(500).json({ error: 'Database error' });
  }
}

// --- Extract, summarize, save & respond ---
export async function extractTextFromPdfHandler(req, res) {
  const { savedPdf } = req;
  const filePath = req.file?.path;
  if (!filePath || !savedPdf) {
    return res.status(400).json({ error: 'Upload step missing' });
  }

  let rawText;
  try {
    // read into buffer and parse
    const buffer = await fs.readFile(filePath);
    const { text = '' } = await pdfParse(buffer);
    rawText = text.trim();

    if (!rawText) {
      return res
        .status(200)
        .json({ message: 'No extractable text (image-based PDF).' });
    }
  } catch (err) {
    console.error('Error reading/parsing PDF:', err);
    return res.status(500).json({ error: 'Failed to parse PDF' });
  }

  try {
    // break into manageable chunks
    const chunks = chunkify(rawText, 6000);

    const summaries = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const resp = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that summarizes PDF content into clear, concise bullet points.',
          },
          {
            role: 'user',
            content: `Here is section ${i + 1} of ${chunks.length}:\n\n${chunk}`,
          },
        ],
      });
      summaries.push(resp.choices[0].message.content.trim());
    }

    const fullSummary = summaries.join('\n\n');

    // save summary back to DB
    await prisma.pdf.update({
      where: { id: savedPdf.id },
      data: { summary: fullSummary },
    });

    // respond with both raw text and summary
    res.status(200).json({
      message: 'PDF processed successfully',
      text: rawText,
      summary: fullSummary,
    });
  } catch (err) {
    console.error('OpenAI or DB error:', err);
    res.status(500).json({ error: 'Failed to summarize PDF' });
  } finally {
    // clean up the uploaded PDF file
    fs.unlink(filePath).catch(() => {});
  }
}
