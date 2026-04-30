import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-vemtap-secret'];
    const secret = this.configService.get<string>('VEMTAP_SHARED_SECRET') || 'dev-shared-secret';

    if (apiKey !== secret) {
      throw new UnauthorizedException('Invalid shared secret');
    }
    return true;
  }
}
