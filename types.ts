export interface ParsedElement {
  type: string; // 'heading' | 'paragraph' | 'list' | 'table' | 'image_description' | 'other'
  content: string;
}

export interface ParsedPage {
  pageNumber: number;
  rawText: string;
  structuredElements: ParsedElement[];
}

export interface ParsedMetadata {
  title: string;
  author: string;
  summary: string;
  language: string;
  topic: string;
}

export interface Transaction {
  post_date: string;     // ISO date, e.g., "2026-01-02"
  trans_date: string;    // ISO date, e.g., "2026-01-02"
  description: string;   // Cleaned description
  amount: number;        // Signed value (positive for debits, negative for credits)
  currency: string;      // e.g., "LKR", "USD"
}

export interface TokenUsage {
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
}

export interface PdfParseResult {
  metadata: ParsedMetadata;
  pages: ParsedPage[];
  transactions?: Transaction[]; // New: Array of extracted transactions
  standardRawText?: string; // For comparison
  tokenUsage?: TokenUsage;
}

export enum ParseStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}