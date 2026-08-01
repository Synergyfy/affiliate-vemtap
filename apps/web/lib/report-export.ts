'use client';

export interface ReportCommentData {
  author: string;
  role: string;
  text: string;
  date: string;
}

export interface ReportCard {
  label: string;
  value: string;
}

export interface ReportSection {
  title: string;
  lines: string[];
}

export interface ReportBusiness {
  name: string;
  type: string;
  status: string;
  notes: string;
  rating?: number;
}

export interface ReportExportData {
  reportTitle: string;
  author: string;
  role: string;
  dateLabel: string;
  summaryCards: ReportCard[];
  summary: string;
  sections: ReportSection[];
  businesses: ReportBusiness[];
  notes: ReportCommentData[];
  comments: ReportCommentData[];
}

const DIVIDER = '────────────────────────────';

function fmtDate(d: string) {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function buildReportText(data: ReportExportData): string {
  const lines: string[] = [];
  lines.push(`*${data.reportTitle}*`);
  lines.push(`Report by: ${data.author} (${data.role})`);
  lines.push(`Date: ${data.dateLabel}`);
  lines.push('');
  lines.push(DIVIDER);
  lines.push('');

  // Performance Summary (cards)
  lines.push('*PERFORMANCE SUMMARY*');
  data.summaryCards.forEach((c) => lines.push(`• ${c.label}: ${c.value}`));
  lines.push('');
  lines.push(DIVIDER);
  lines.push('');

  // Summary paragraph
  lines.push('*SUMMARY*');
  lines.push(data.summary);
  lines.push('');
  lines.push(DIVIDER);
  lines.push('');

  // Detailed breakdown sections
  lines.push('*DETAILED BREAKDOWN*');
  data.sections.forEach((s) => {
    lines.push('');
    lines.push(`**${s.title}**`);
    s.lines.forEach((l) => lines.push(`• ${l}`));
  });
  lines.push('');
  lines.push(DIVIDER);
  lines.push('');

  // Businesses visited
  if (data.businesses.length > 0) {
    lines.push('*BUSINESSES VISITED*');
    data.businesses.forEach((b) => {
      const stars = b.rating ? ` ${'★'.repeat(Math.max(0, Math.min(5, b.rating)))}${'☆'.repeat(Math.max(0, 5 - Math.min(5, b.rating)))}` : '';
      lines.push(`• ${b.name} (${b.type}) — ${b.status}${stars}`);
      if (b.notes) lines.push(`   Notes: ${b.notes}`);
    });
    lines.push('');
    lines.push(DIVIDER);
    lines.push('');
  }

  // System-generated notes
  lines.push('*NOTES*');
  if (data.notes.length === 0) {
    lines.push('No system notes for this report.');
  } else {
    data.notes.forEach((c) => {
      lines.push(`• ${c.text} (${fmtDate(c.date)})`);
    });
  }
  lines.push('');
  lines.push(DIVIDER);
  lines.push('');

  // User comments
  lines.push('*COMMENTS*');
  if (data.comments.length === 0) {
    lines.push('No comments yet. Add your comments.');
  } else {
    data.comments.forEach((c) => {
      lines.push(`• [${c.author} — ${c.role}] ${c.text} (${fmtDate(c.date)})`);
    });
  }
  lines.push('');
  lines.push('— Generated via Vemtap');

  return lines.join('\n');
}

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function buildReportHtml(data: ReportExportData): string {
  const cards = data.summaryCards
    .map(
      (c) => `
      <div class="card">
        <div class="card-label">${esc(c.label)}</div>
        <div class="card-value">${esc(c.value)}</div>
      </div>`
    )
    .join('');

  const sections = data.sections
    .map(
      (s) => `
      <div class="section">
        <h4 class="section-title">${esc(s.title)}</h4>
        <ul class="section-list">
          ${s.lines.map((l) => `<li>${esc(l)}</li>`).join('')}
        </ul>
      </div>`
    )
    .join('');

  const businesses = data.businesses
    .map((b) => {
      const stars = b.rating ? `${'★'.repeat(Math.max(0, Math.min(5, b.rating)))}${'☆'.repeat(Math.max(0, 5 - Math.min(5, b.rating)))}` : '';
      const statusColor = b.status === 'Converted' ? '#059669' : b.status === 'Visited' ? '#2563eb' : '#d97706';
      return `
      <div class="business">
        <div class="business-head">
          <span class="business-name">${esc(b.name)}</span>
          <span class="business-type">${esc(b.type)}</span>
          <span class="business-status" style="background:${statusColor}">${esc(b.status)}</span>
          ${stars ? `<span class="business-rating">${stars}</span>` : ''}
        </div>
        ${b.notes ? `<div class="business-notes">${esc(b.notes)}</div>` : ''}
      </div>`;
    })
    .join('');

  const comments = data.comments
    .map(
      (c) => `
      <div class="comment">
        <div class="comment-text">${esc(c.text)}</div>
        <div class="comment-meta">${esc(c.author)} · ${esc(c.role)} · ${esc(fmtDate(c.date))}</div>
      </div>`
    )
    .join('');

  const notes = data.notes
    .map(
      (c) => `
      <div class="comment">
        <div class="comment-text">${esc(c.text)}</div>
        <div class="comment-meta">${esc(fmtDate(c.date))}</div>
      </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${esc(data.reportTitle)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f1f5f9; color: #0f172a; padding: 24px;
  }
  .sheet { max-width: 760px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(2,6,23,.08); }
  .hero { background: linear-gradient(135deg, #2563eb, #4f46e5); color: #fff; padding: 28px 32px; }
  .hero h1 { font-size: 22px; font-weight: 900; }
  .hero p { font-size: 13px; color: rgba(255,255,255,.85); margin-top: 4px; }
  .content { padding: 28px 32px; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 24px; }
  .card { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 14px; padding: 14px; text-align: center; }
  .card-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: .5px; }
  .card-value { font-size: 22px; font-weight: 900; color: #1d4ed8; margin-top: 4px; }
  .summary { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin-bottom: 24px; }
  .summary-title { font-size: 11px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 8px; }
  .summary p { font-size: 13px; line-height: 1.6; color: #334155; }
  .section { margin-bottom: 18px; }
  .section-title { font-size: 13px; font-weight: 800; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 10px; }
  .section-list { list-style: none; }
  .section-list li { font-size: 13px; color: #334155; line-height: 1.6; padding-left: 14px; position: relative; }
  .section-list li::before { content: '•'; position: absolute; left: 0; color: #2563eb; font-weight: 900; }
  .business { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; margin-bottom: 8px; }
  .business-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .business-name { font-size: 13px; font-weight: 800; color: #0f172a; }
  .business-type { font-size: 11px; color: #64748b; }
  .business-status { font-size: 9px; font-weight: 800; color: #fff; padding: 2px 7px; border-radius: 999px; text-transform: uppercase; letter-spacing: .5px; }
  .business-rating { font-size: 11px; color: #f59e0b; }
  .business-notes { font-size: 11px; color: #64748b; margin-top: 4px; }
  .comment { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 10px 12px; margin-bottom: 8px; }
  .comment-text { font-size: 13px; color: #334155; line-height: 1.5; }
  .comment-meta { font-size: 10px; color: #94a3b8; margin-top: 4px; }
  .empty { font-size: 13px; color: #94a3b8; font-style: italic; }
  .footer { text-align: center; font-size: 10px; color: #94a3b8; padding: 16px 32px 20px; border-top: 1px solid #f1f5f9; }
  @media print {
    body { background: #fff; padding: 0; }
    .sheet { box-shadow: none; border-radius: 0; max-width: 100%; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <div class="hero">
      <h1>${esc(data.reportTitle)}</h1>
      <p>Report by: ${esc(data.author)} (${esc(data.role)}) · ${esc(data.dateLabel)}</p>
    </div>
    <div class="content">
      <div class="cards">${cards}</div>
      <div class="summary">
        <div class="summary-title">Summary</div>
        <p>${esc(data.summary)}</p>
      </div>
      <h3 style="font-size:15px;font-weight:900;color:#0f172a;margin-bottom:12px;">Detailed Breakdown</h3>
      ${sections}
      ${data.businesses.length ? `<h3 style="font-size:15px;font-weight:900;color:#0f172a;margin:20px 0 12px;">Businesses Visited</h3>${businesses}` : ''}
      <h3 style="font-size:15px;font-weight:900;color:#0f172a;margin:20px 0 12px;">Notes</h3>
      ${data.notes.length ? notes : '<div class="empty">No system notes for this report.</div>'}
      <h3 style="font-size:15px;font-weight:900;color:#0f172a;margin:20px 0 12px;">Comments</h3>
      ${data.comments.length ? comments : '<div class="empty">No comments yet. Add your comments.</div>'}
    </div>
    <div class="footer">Generated via Vemtap</div>
  </div>
</body>
</html>`;
}

export function downloadReportAsPdf(data: ReportExportData) {
  const html = buildReportHtml(data);
  const title = `${data.reportTitle.replace(/[^a-z0-9]+/gi, '-').replace(/-+/g, '-').toLowerCase()}-report.pdf`;
  const win = window.open('', '_blank', 'noopener');
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.document.title = title;
  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch {
      /* ignore */
    }
  }, 400);
  return true;
}

export async function shareReport(data: ReportExportData) {
  const text = buildReportText(data);
  if (navigator.share) {
    await navigator.share({ title: data.reportTitle, text });
  } else {
    await navigator.clipboard.writeText(text);
  }
}
