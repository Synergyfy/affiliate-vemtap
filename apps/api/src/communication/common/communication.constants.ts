/**
 * Canonical journey states for the Communication Engine.
 *
 * A journey state is a normalized interpretation of a contact's sales status
 * derived from `Lead.status`, `SalesPipeline.pipelineStage`/`exitState` and
 * `Business.status`. The Communication Engine drives messaging based on this
 * state rather than the raw enums, keeping communication separate from the
 * raw sales status while still being driven by it.
 */
export const JOURNEY_STATES = [
  'NEW',
  'CONTACTED',
  'VISITED',
  'INTERESTED',
  'FOLLOW_UP_REQUIRED',
  'NOT_INTERESTED',
  'SUBSCRIBED',
  'EXPIRED',
  'LOST_CLOSED',
] as const;

export type JourneyState = (typeof JOURNEY_STATES)[number];

/**
 * Journey states that are still part of the sales (lead nurture) journey and
 * therefore eligible to receive "subscribe to VEMTAP" style messaging.
 */
export const LEAD_NURTURE_STATES: JourneyState[] = [
  'NEW',
  'CONTACTED',
  'VISITED',
  'INTERESTED',
  'FOLLOW_UP_REQUIRED',
];

/** Journey states for which no further sales/marketing messaging should occur. */
export const TERMINAL_STATES: JourneyState[] = [
  'SUBSCRIBED',
  'NOT_INTERESTED',
  'LOST_CLOSED',
];

/**
 * WhatsApp deep-link prefix. We intentionally do NOT automate WhatsApp Web:
 * VEMTAP only prepares the recipient + message, opens WhatsApp, and lets the
 * user send. Later, if the official WhatsApp Business API is adopted, the same
 * `CommunicationMessage` outbox can be upgraded to automated sending.
 */
export const WHATSAPP_DEEP_LINK_PREFIX = 'https://wa.me';

/**
 * SMS hard limit (a single SMS segment). Enforced AFTER variables are replaced.
 */
export const SMS_MAX_LENGTH = 160;

/**
 * Variable placeholders supported when rendering a template/message body.
 * Replaced at send time with values resolved from the contact Lead.
 */
export const SUPPORTED_VARIABLES = [
  '[Business Name]',
  '[Contact Name]',
  '[Area]',
  '[Agent Name]',
] as const;

export function phoneToInternational(phone?: string | null): string | null {
  if (!phone) return null;
  let digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return null;
  // 08xx... -> +2348xx...
  if (digits.startsWith('0')) {
    digits = '234' + digits.slice(1);
  }
  // Already 234...
  return digits;
}

/**
 * A searchable suffix used to match a phone number against another phone stored
 * in a different format (e.g. lead `08012345678` vs business `2348012345678`).
 * Both normalize to the same trailing digits (`8012345678` for Nigerian mobile
 * numbers), making `contains` matching format-agnostic.
 */
export function phoneSearchTail(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return null;
  return digits.slice(-10);
}
