import { DocumentProcessorServiceClient } from "@google-cloud/documentai";

function getGooglePrivateKey() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("GOOGLE_PRIVATE_KEY is missing");
  }

  return privateKey.replace(/\\n/g, "\n");
}

function getDocumentAiConfig() {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION;
  const processorId = process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!projectId) {
    throw new Error("GOOGLE_CLOUD_PROJECT_ID is missing");
  }

  if (!location) {
    throw new Error("GOOGLE_CLOUD_LOCATION is missing");
  }

  if (!processorId) {
    throw new Error("GOOGLE_DOCUMENT_AI_PROCESSOR_ID is missing");
  }

  if (!clientEmail) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL is missing");
  }

  return {
    projectId,
    location,
    processorId,
    clientEmail,
    privateKey: getGooglePrivateKey()
  };
}

function getDocumentAiClient() {
  const config = getDocumentAiConfig();

  const apiEndpoint =
    config.location === "us"
      ? "us-documentai.googleapis.com"
      : `${config.location}-documentai.googleapis.com`;

  return new DocumentProcessorServiceClient({
    apiEndpoint,
    credentials: {
      client_email: config.clientEmail,
      private_key: config.privateKey
    }
  });
}

export async function extractTextFromPdfUsingDocumentAi({ pdfBuffer }) {
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error("PDF buffer is empty");
  }

  const config = getDocumentAiConfig();
  const client = getDocumentAiClient();

  const name = client.processorPath(
    config.projectId,
    config.location,
    config.processorId
  );

  try {
    const [result] = await client.processDocument({
      name,
      rawDocument: {
        content: pdfBuffer.toString("base64"),
        mimeType: "application/pdf"
      },

      /*
        Imageless mode increases the online/synchronous page limit
        for supported processors from 15 pages to 30 pages.

        This helps with scanned PDFs that are 16–30 pages.
        Larger documents still need batch/offline OCR.
      */
      imagelessMode: true
    });

    const document = result.document;
    const text = document?.text || "";

    return {
      text,
      provider: "google_document_ai",
      pageCount: Array.isArray(document?.pages) ? document.pages.length : 0,
      mode: "online_imageless"
    };
  } catch (error) {
    const enhancedError = new Error(createHelpfulDocumentAiError(error));

    enhancedError.originalError = error;
    enhancedError.code = error.code;
    enhancedError.reason = error.reason || "";
    enhancedError.domain = error.domain || "";

    throw enhancedError;
  }
}

function createHelpfulDocumentAiError(error) {
  const details = error.details || error.message || "Document AI OCR failed";
  const pageLimit = error.errorInfoMetadata?.page_limit;
  const pages = error.errorInfoMetadata?.pages;

  if (error.reason === "PAGE_LIMIT_EXCEEDED") {
    if (pageLimit && pages) {
      return `Document AI page limit exceeded. This document has ${pages} pages, but the current online OCR limit is ${pageLimit} pages. Documents over 30 pages need batch/offline OCR.`;
    }

    return "Document AI page limit exceeded. Documents over 30 pages need batch/offline OCR.";
  }

  if (details.toLowerCase().includes("non-imageless mode")) {
    return `${details} Imageless mode is now enabled; please retry OCR for this document.`;
  }

  return details;
}