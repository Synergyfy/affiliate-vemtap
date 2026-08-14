import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiKeysService } from '../api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const rawKey = request.headers['x-api-key'];

    if (!rawKey) {
      throw new UnauthorizedException('Missing x-api-key header');
    }

    // Primary path per Vemtap contract: validate against VEMTAP_AFFILIATE_KEY.
    const envKey = this.configService.get<string>('VEMTAP_AFFILIATE_KEY');
    if (envKey && rawKey === envKey) {
      return true;
    }

    // Fallback: legacy DB-issued API keys.
    await this.apiKeysService.validateKey(rawKey);
    return true;
  }
}
