'use client';

export interface ReportComment {
  id: string;
  author: string;
  role: string;
  text: string;
  date: string;
}

export type ReportCommentMap = Record<string, ReportComment[]>;

// Legacy operations screens no longer persist report comments in browser storage.
export function getReportComments(_key: string): ReportComment[] {
  return [];
}

export function getAllReportComments(): ReportCommentMap {
  return {};
}
