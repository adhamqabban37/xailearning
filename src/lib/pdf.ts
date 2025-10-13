
import fs from 'fs';
import pdf from 'pdf-parse';

export async function parsePdfBuffer(buffer: Buffer) {
  if (!buffer || buffer.length === 0) throw new Error('Empty buffer provided to PDF parser.');
  // Quick magic byte check for '%PDF'
  if (!buffer.slice(0, 5).toString('utf8').includes('%PDF')) {
    throw new Error('File is not a valid PDF (missing %PDF magic number).');
  }
  try {
    return await pdf(buffer);
  } catch (err: any) {
      console.error("Error in pdf-parse:", err);
      throw new Error("Failed to parse PDF content.");
  }
}

export async function parsePdfPath(path: string) {
  if (!fs.existsSync(path)) {
      throw new Error(`File not found at path: ${path}`);
  }
  const buffer = fs.readFileSync(path);
  return parsePdfBuffer(buffer);
}
