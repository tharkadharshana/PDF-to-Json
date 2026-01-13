import { GoogleGenAI, Type } from "@google/genai";
import { PdfParseResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert File to Base64
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const parsePdfWithGemini = async (file: File): Promise<PdfParseResult> => {
  try {
    const pdfPart = await fileToGenerativePart(file);

    const prompt = `
      Analyze this PDF document (likely a bank/credit card statement, receipt, or invoice) and extract its content into a structured JSON format.
      
      Requirements:
      1. Extract global metadata (title, author, brief summary, detected language, main topic).
      2. Iterate through each page and extract the page number, raw text, and a list of structured elements.
      3. Classify structured elements as 'heading', 'paragraph', 'list', 'table', 'image_description' (if applicable), or 'other'.
      4. Extract ALL transactions as a top-level array "transactions". For each transaction:
         - Scan for tables or lists containing dates, descriptions, and amounts.
         - Normalize 'post_date' and 'trans_date' to ISO YYYY-MM-DD format. If only one date is present, use it for both.
         - Clean the 'description' (remove extra whitespace or partial URLs).
         - Parse 'amount' as a number. Ensure correct sign: Positive for debits/purchases, Negative for credits/payments/refunds.
         - Infer 'currency' from context (e.g., "$", "LKR", "EUR").
         - Exclude subtotals, balance brought forward, or page totals. Only extract individual line items.
      5. If no financial transactions are found, return an empty array for 'transactions'.
      6. Ensure the output matches the defined JSON schema perfectly.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          pdfPart,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            metadata: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                author: { type: Type.STRING },
                summary: { type: Type.STRING },
                language: { type: Type.STRING },
                topic: { type: Type.STRING }
              }
            },
            transactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  post_date: { type: Type.STRING },
                  trans_date: { type: Type.STRING },
                  description: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  currency: { type: Type.STRING }
                }
              }
            },
            pages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pageNumber: { type: Type.INTEGER },
                  rawText: { type: Type.STRING },
                  structuredElements: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        type: { 
                          type: Type.STRING,
                          enum: ["heading", "paragraph", "list", "table", "image_description", "other"]
                        },
                        content: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("No response text received from Gemini.");
    }

    const jsonResult = JSON.parse(response.text) as PdfParseResult;

    // Extract token usage metadata from the response
    const usage = response.usageMetadata;
    const tokenUsage = {
        promptTokens: usage?.promptTokenCount || 0,
        responseTokens: usage?.candidatesTokenCount || 0,
        totalTokens: usage?.totalTokenCount || 0
    };

    return {
      ...jsonResult,
      tokenUsage
    };

  } catch (error) {
    console.error("Error parsing PDF with Gemini:", error);
    throw error;
  }
};