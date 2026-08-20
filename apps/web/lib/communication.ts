import { Lead } from '@/types/api';
import { TEMPLATE_VARIABLES, TemplateVariable, VariableField } from '@/types/communication';

const NON_GSM_CHARS =
  /[^\x00-\x7F\u20AC]/;
const GSM7_CHARSET =
  /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#$%&'()*+,\-./0123456789:;<=>?¡§¿ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ`^abcdefghijklmnopqrstuvwxyzäöñüà{}~\[\]\\|€\x20\x09\x0D\x0A]*$/;

export interface SmsCharacterCount {
  chars: number;
  parts: number;
  over: boolean;
}

export function normalizePhoneToE164(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return '234' + digits.slice(1);
  if (digits.startsWith('+')) return digits.slice(1);
  return digits;
}

export function buildWhatsAppLink(phone?: string | null, message?: string): string {
  const e164 = normalizePhoneToE164(phone);
  if (!e164) return '';
  const base = `https://wa.me/${e164}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function openWhatsApp(phone?: string | null, message?: string): void {
  const link = buildWhatsAppLink(phone, message);
  if (!link) return;
  window.open(link, '_blank', 'noopener,noreferrer');
}

export function parseTemplateVariables(body: string): TemplateVariable[] {
  return TEMPLATE_VARIABLES.filter((v) => body.includes(v.token));
}

export function resolveVariableValue(field: VariableField, lead: Partial<Lead>): string {
  switch (field) {
    case 'businessName':
      return lead.businessName || '';
    case 'contactName':
      return lead.contactName || '';
    case 'location':
      return lead.location || '';
    case 'agentName':
      return lead.user?.fullName || '' ;
    default:
      return '';
  }
}

export function substituteVariables(body: string, lead: Partial<Lead>): string {
  let resolved = body;
  for (const variable of TEMPLATE_VARIABLES) {
    const value = resolveVariableValue(variable.field, lead);
    resolved = resolved.split(variable.token).join(value);
  }
  return resolved;
}

/**
 * Counts SMS characters following the GSM 7-bit encoding rules.
 * Messages containing non-GSM characters (emoji, unicode) are counted
 * against the 70-char limit per part.
 */
export function countSmsCharacters(text: string): SmsCharacterCount {
  const chars = text.length;
  const multiPartCapable = NON_GSM_CHARS.test(text) || !GSM7_CHARSET.test(text);
  const perPart = multiPartCapable ? 70 : 160;
  const parts = Math.max(1, Math.ceil(chars / perPart));
  return { chars, parts, over: chars > perPart };
}

export function estimateSmsCost(message: string, unitCostPerSms?: number | null): number | null {
  if (unitCostPerSms == null) return null;
  const { parts } = countSmsCharacters(message);
  return parts * unitCostPerSms;
}

export function formatMessageDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
  });
}

export function formatMessageDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString([], { day: 'numeric', month: 'short' })} · ${d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export function isCustomerStatus(status?: string): boolean {
  return !!status && ['CUSTOMER', 'CONVERTED', 'SUBSCRIBED'].includes(status.toUpperCase());
}