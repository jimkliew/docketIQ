/**
 * Attachment extraction utilities for DocketIQ
 * Handles downloading and extracting text from PDF and DOCX attachments
 */

/**
 * Extract text from a PDF file using PDF.js (requires external library)
 * @param {ArrayBuffer} arrayBuffer - The PDF file data
 * @returns {Promise<string>} Extracted text content
 */
export async function extractTextFromPDF(arrayBuffer) {
  // PDF.js would need to be added as a dependency
  // For now, return a placeholder
  return "[PDF text extraction requires pdf.js library - not yet implemented]";
}

/**
 * Extract text from a DOCX file
 * @param {ArrayBuffer} arrayBuffer - The DOCX file data
 * @returns {Promise<string>} Extracted text content
 */
export async function extractTextFromDOCX(arrayBuffer) {
  // Mammoth.js would need to be added for DOCX extraction
  return "[DOCX text extraction requires mammoth.js library - not yet implemented]";
}

/**
 * Download and extract text from an attachment URL
 * @param {Object} attachment - Attachment metadata from Regulations.gov API
 * @returns {Promise<Object>} Attachment with extracted text
 */
export async function processAttachment(attachment) {
  if (!attachment.fileUrl) {
    return {
      ...attachment,
      extractedText: null,
      extractionStatus: "no-url",
    };
  }

  try {
    // Attempt to fetch the file
    const response = await fetch(attachment.fileUrl, {
      mode: "cors",
    });

    if (!response.ok) {
      return {
        ...attachment,
        extractedText: null,
        extractionStatus: "fetch-failed",
        error: `HTTP ${response.status}`,
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const format = (attachment.format || "").toLowerCase();

    let extractedText = "";

    if (format.includes("pdf")) {
      extractedText = await extractTextFromPDF(arrayBuffer);
    } else if (format.includes("doc")) {
      extractedText = await extractTextFromDOCX(arrayBuffer);
    } else if (format.includes("txt")) {
      const decoder = new TextDecoder("utf-8");
      extractedText = decoder.decode(arrayBuffer);
    } else {
      return {
        ...attachment,
        extractedText: null,
        extractionStatus: "unsupported-format",
      };
    }

    return {
      ...attachment,
      extractedText,
      extractionStatus: "success",
    };
  } catch (error) {
    return {
      ...attachment,
      extractedText: null,
      extractionStatus: "error",
      error: error.message,
    };
  }
}

/**
 * Process multiple attachments in parallel
 * @param {Array} attachments - Array of attachment objects
 * @param {Object} options - Processing options
 * @returns {Promise<Array>} Processed attachments with extracted text
 */
export async function processAttachments(attachments, options = {}) {
  const { maxConcurrent = 3, timeout = 30000 } = options;

  // Process in batches to avoid overwhelming the browser
  const results = [];
  for (let i = 0; i < attachments.length; i += maxConcurrent) {
    const batch = attachments.slice(i, i + maxConcurrent);
    const batchPromises = batch.map((att) =>
      Promise.race([
        processAttachment(att),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), timeout)
        ),
      ]).catch((error) => ({
        ...att,
        extractedText: null,
        extractionStatus: "error",
        error: error.message,
      }))
    );
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Combine comment text with attachment text
 * @param {Object} comment - Comment object with attachments
 * @param {Array} processedAttachments - Attachments with extracted text
 * @returns {Object} Comment with enhanced text
 */
export function enhanceCommentWithAttachments(comment, processedAttachments) {
  const attachmentTexts = processedAttachments
    .filter((att) => att.extractionStatus === "success" && att.extractedText)
    .map((att) => att.extractedText)
    .filter(Boolean);

  if (attachmentTexts.length === 0) {
    return comment;
  }

  const enhancedText = [
    comment.source_text,
    "",
    "[Attachment content]",
    ...attachmentTexts,
  ].join("\n\n");

  return {
    ...comment,
    source_text: comment.source_text, // Keep original separate
    enhanced_text: enhancedText, // Full text with attachments
    attachment_texts: attachmentTexts,
    hasEnhancedText: true,
  };
}

/**
 * Get a summary of attachment extraction results
 * @param {Array} processedAttachments - Attachments with extraction status
 * @returns {Object} Summary statistics
 */
export function getExtractionSummary(processedAttachments) {
  const total = processedAttachments.length;
  const successful = processedAttachments.filter(
    (att) => att.extractionStatus === "success"
  ).length;
  const failed = processedAttachments.filter(
    (att) => att.extractionStatus === "error" || att.extractionStatus === "fetch-failed"
  ).length;
  const unsupported = processedAttachments.filter(
    (att) => att.extractionStatus === "unsupported-format"
  ).length;

  return {
    total,
    successful,
    failed,
    unsupported,
    successRate: total > 0 ? (successful / total) * 100 : 0,
  };
}
