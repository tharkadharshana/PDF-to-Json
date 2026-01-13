import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source to the matching version on esm.sh
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs';

export const parsePdfLocal = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      // Concatenate text items with a space, then add newlines for basic formatting
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += `--- PAGE ${i} ---\n\n${pageText}\n\n`;
    }

    return fullText;
  } catch (error) {
    console.error("Local PDF parsing failed:", error);
    return "Error: Could not extract raw text from PDF for comparison.";
  }
};