
import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';
import multer from 'multer';
import { parsePdfBuffer } from '@/lib/pdf';

// Configure multer for in-memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB limit
});

// Create the handler using next-connect
const handler = nextConnect<NextApiRequest & { file: Express.Multer.File }, NextApiResponse>({
  onError(err, req, res) {
    res.status(500).json({ error: `Upload error: ${err.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  },
});

// Use the multer middleware to handle single file uploads on the 'file' field
handler.use(upload.single('file'));

// Define the POST handler
handler.post(async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded. Please include a file in the "file" field.' });
    }
    
    // Optional: You can check mime type from client, but buffer check is more reliable
    if (!file.mimetype?.includes('pdf')) {
      // Allow it to proceed, but rely on the magic number check below
      console.warn(`Client MIME type is ${file.mimetype}, but proceeding with buffer check.`);
    }

    // The 'file.buffer' is a Node.js Buffer provided by multer.memoryStorage()
    const data = await parsePdfBuffer(file.buffer);

    return res.status(200).json({
      text: data.text || '',
      numPages: data.numpages,
      info: data.info ?? {},
    });
  } catch (err: any) {
    // Return a sanitized error message
    return res.status(500).json({ error: `Failed to parse PDF: ${err?.message ?? 'unknown error'}` });
  }
});

// Required for multer to work with Next.js API routes
export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
