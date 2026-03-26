// Shared types used across the app

export type DocumentStatus = "draft" | "final" | "sent" | "approved" | "cancelled";

export type VisualType = "inspiration_board" | "visualisation";

export interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  total: number;
  sortOrder?: number;
}

export interface AttachmentFile {
  id: string;
  fileName: string;
  mimeType: string;
  fileUrl: string;
  fileSize?: number | null;
  createdAt: Date;
}

export interface ClientSummary {
  id: string;
  fullName: string;
  companyName?: string | null;
  address: string;
  email?: string | null;
  phone?: string | null;
}

export interface QuoteSummary {
  id: string;
  ref: string;
  date: Date;
  title?: string | null;
  address: string;
  status: string;
  total: number | string;
  hasImages: boolean;
  client: ClientSummary;
}

export interface InvoiceSummary {
  id: string;
  ref: string;
  date: Date;
  address: string;
  total: number | string;
  hasImages: boolean;
  sourceQuoteId?: string | null;
  client: ClientSummary;
}
