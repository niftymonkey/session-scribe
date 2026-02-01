import mammoth from "mammoth";

/**
 * Extracts plain text from a DOCX file.
 * @param arrayBuffer - The DOCX file contents as an ArrayBuffer
 * @returns The extracted text content
 */
export async function extractTextFromDocx(
  arrayBuffer: ArrayBuffer
): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}
