import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MessageRendererService } from '../common/message-renderer.service';

describe('MessageRendererService', () => {
  let service: MessageRendererService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessageRendererService],
    }).compile();
    service = module.get<MessageRendererService>(MessageRendererService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('render', () => {
    it('replaces supported variables with contact values', () => {
      const rendered = service.render(
        'Hi [Business Name], thanks [Contact Name] from [Area]. Regards [Agent Name]',
        {
          businessName: 'ABC Restaurant',
          contactName: 'John',
          location: 'Apo',
          agentName: 'Agent A',
        },
      );
      expect(rendered).toBe(
        'Hi ABC Restaurant, thanks John from Apo. Regards Agent A',
      );
    });

    it('leaves unknown variables untouched', () => {
      const rendered = service.render('Hello [Unknown Var]', {});
      expect(rendered).toBe('Hello [Unknown Var]');
    });

    it('replaces empty context values with empty string', () => {
      expect(service.render('Hi [Business Name]!', {})).toBe('Hi !');
    });
  });

  describe('assertSmsLength', () => {
    it('throws when an SMS body exceeds 160 characters', () => {
      const longBody = 'x'.repeat(161);
      expect(() => service.assertSmsLength(longBody, 'SMS')).toThrow(BadRequestException);
    });

    it('accepts an SMS body of exactly 160 characters', () => {
      const body = 'x'.repeat(160);
      expect(() => service.assertSmsLength(body, 'SMS')).not.toThrow();
    });

    it('does not enforce the limit for WhatsApp', () => {
      const longBody = 'x'.repeat(1000);
      expect(() => service.assertSmsLength(longBody, 'WHATSAPP')).not.toThrow();
    });
  });

  describe('blacklisted words', () => {
    it('finds case-insensitive blacklisted words', () => {
      expect(service.findBlacklistedWord('Get this CRYPTO deal now', ['crypto', 'scam'])).toBe('crypto');
      expect(service.findBlacklistedWord('Normal message here', ['crypto', 'scam'])).toBeNull();
    });

    it('returns null for empty or null blacklisted list', () => {
      expect(service.findBlacklistedWord('Any message', [])).toBeNull();
      expect(service.findBlacklistedWord('Any message', null)).toBeNull();
    });

    it('throws BadRequestException when assertNoBlacklistedWords encounters a prohibited word in SMS', () => {
      expect(() =>
        service.assertNoBlacklistedWords('This is a scam alert', 'SMS', ['scam', 'crypto']),
      ).toThrow(BadRequestException);
    });

    it('does not throw for WhatsApp or when clean', () => {
      expect(() =>
        service.assertNoBlacklistedWords('This is a scam alert', 'WHATSAPP', ['scam', 'crypto']),
      ).not.toThrow();
      expect(() =>
        service.assertNoBlacklistedWords('Clean SMS message', 'SMS', ['scam', 'crypto']),
      ).not.toThrow();
    });
  });
});

