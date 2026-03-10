/**
 * File Parser Module
 * Handles extraction of raw text from PDF, DOCX, and plain text files.
 */

const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

/**
 * Extract text from a file based on its extension.
 * Supported: .pdf, .docx, .doc, .txt
 * @param {string} filePath - Absolute path to the file.
 * @returns {Promise<string>} Raw text content.
 */
async function extractText(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
        case ".pdf":
            return extractFromPDF(filePath);
        case ".docx":
        case ".doc":
            return extractFromDOCX(filePath);
        case ".txt":
            return extractFromTXT(filePath);
        default:
            throw new Error(`Unsupported file type: ${ext}. Supported: .pdf, .docx, .txt`);
    }
}

/**
 * Extract text from a PDF file.
 */
async function extractFromPDF(filePath) {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text || "";
}

/**
 * Extract text from a DOCX file.
 */
async function extractFromDOCX(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || "";
}

/**
 * Extract text from a plain text file.
 */
async function extractFromTXT(filePath) {
    return fs.readFileSync(filePath, "utf-8");
}

module.exports = {
    extractText,
    extractFromPDF,
    extractFromDOCX,
    extractFromTXT,
};
