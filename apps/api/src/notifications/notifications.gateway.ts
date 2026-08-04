import { Injectable, Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@Injectable()
@WebSocketGateway({
  namespace: 'notifications',
  cors: { origin: true, credentials: true },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken) return authToken;

    const cookie = client.handshake.headers.cookie || '';
    const match = cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) throw new Error('Missing token');

      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload?.sub;
      if (!userId) throw new Error('Missing user id');

      client.data.userId = userId;
      await client.join(`user:${userId}`);
    } catch (err) {
      this.logger.warn(`[WS] Rejected connection: ${err?.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(): void {
    // Socket.io removes clients from rooms automatically on disconnect.
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  emitToUsers(userIds: string[], event: string, payload: unknown): void {
    for (const userId of userIds) {
      this.server.to(`user:${userId}`).emit(event, payload);
    }
  }
}
