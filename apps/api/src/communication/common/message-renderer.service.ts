import { Injectable, BadRequestException } from '@nestjs/common';
import { SMS_MAX_LENGTH, SUPPORTED_VARIABLES } from '../common/communication.constants';

export type RenderContext = {
  businessName?: string | null;
  contactName?: string | null;
  location?: string | null;
  agentName?: string | null;
};

@Injectable()
export class MessageRendererService {
  /**
   * Representative (longest realistic) values used to validate SMS templates
   * before real variable values are known, so templates that will almost
   * certainly exceed the 160-character limit are rejected early.
   */
  private static readonly WORST_CASE_VARIABLES: Record<string, string> = {
    '[Business Name]': 'International Business Ventures Limited',
    '[Contact Name]': 'Abdulrahman Muhammad',
    '[Area]': 'Central Business District',
    '[Agent Name]': 'Abdulrahman',
  };

  /**
   * Replace supported `[Variable]` placeholders with values from the contact.
   * Unknown placeholders are left as-is.
   */
  render(body: string, context: RenderContext): string {
    if (!body) return body;

    const values: Record<string, string> = {
      '[Business Name]': context.businessName ?? '',
      '[Contact Name]': context.contactName ?? '',
      '[Area]': context.location ?? '',
      '[Agent Name]': context.agentName ?? '',
    };

    let rendered = body;
    for (const key of SUPPORTED_VARIABLES) {
      rendered = rendered.split(key).join(values[key] ?? '');
    }
    return rendered;
  }

  /**
   * Validate a rendered SMS body does not exceed the 160-character limit.
   * The length must be checked AFTER variables are replaced.
   */
  assertSmsLength(renderedBody: string, channel: 'WHATSAPP' | 'SMS'): void {
    if (channel !== 'SMS') return;
    if (renderedBody.length > SMS_MAX_LENGTH) {
      throw new BadRequestException(
        `Message exceeds the ${SMS_MAX_LENGTH}-character limit (${renderedBody.length}/${SMS_MAX_LENGTH}).`,
      );
    }
  }

  /**
   * Validate an SMS body using worst-case variable substitution so an over-long
   * message is rejected at creation time (before it is ever queued/activated).
   */
  assertSmsTemplateLength(body: string): void {
    let rendered = body;
    for (const key of SUPPORTED_VARIABLES) {
      rendered = rendered
        .split(key)
        .join(MessageRendererService.WORST_CASE_VARIABLES[key] ?? '');
    }
    this.assertSmsLength(rendered, 'SMS');
  }

  /**
   * Check if a message body contains any blacklisted words or phrases.
   * Returns the first matched blacklisted word/phrase, or null if clean.
   */
  findBlacklistedWord(body: string, blacklistedWords?: string[] | null): string | null {
    if (!body || !blacklistedWords || blacklistedWords.length === 0) return null;
    const lowerBody = body.toLowerCase();
    for (const raw of blacklistedWords) {
      const word = raw?.trim().toLowerCase();
      if (word && lowerBody.includes(word)) {
        return raw.trim();
      }
    }
    return null;
  }

  /**
   * Validate that an SMS body does not contain any blacklisted words.
   */
  assertNoBlacklistedWords(
    body: string,
    channel: 'WHATSAPP' | 'SMS' | string,
    blacklistedWords?: string[] | null,
  ): void {
    if (channel !== 'SMS') return;
    const matched = this.findBlacklistedWord(body, blacklistedWords);
    if (matched) {
      throw new BadRequestException(
        `Message contains prohibited word/phrase: "${matched}".`,
      );
    }
  }
}

