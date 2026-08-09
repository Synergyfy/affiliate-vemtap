'use client';

export interface ReportComment {
  id: string;
  author: string;
  role: string;
  text: string;
  date: string;
}

const STORAGE_KEY = 'vemtap_report_comments';

export type ReportCommentMap = Record<string, ReportComment[]>;

function readStore(): ReportCommentMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReportCommentMap) : {};
  } catch {
    return {};
  }
}

function writeStore(map: ReportCommentMap) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function getReportComments(key: string): ReportComment[] {
  return readStore()[key] || [];
}

export function addReportComment(key: string, comment: Omit<ReportComment, 'id' | 'date'>) {
  const map = readStore();
  const list = map[key] || [];
  const entry: ReportComment = {
    ...comment,
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: new Date().toISOString(),
  };
  map[key] = [...list, entry];
  writeStore(map);
  return entry;
}

export function getAllReportComments(): ReportCommentMap {
  return readStore();
}
