import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    signup: jest.fn(),
    login: jest.fn(),
    validateUser: jest.fn(),
    refreshTokens: jest.fn(),
    invalidateAllTokens: jest.fn(),
    jwtService: { decode: jest.fn() },
  };

  const mockResponse = () => {
    const res: Partial<Response> = {};
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should set cookies and return user on successful login', async () => {
      const res = mockResponse();
      const req = {
        header: jest.fn().mockReturnValue('127.0.0.1'),
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
      } as any;
      const user = { id: '1', email: 'test@test.com' };
      mockAuthService.validateUser.mockResolvedValueOnce(user);
      mockAuthService.login.mockResolvedValueOnce({
        accessToken: 'access',
        refreshToken: 'refresh',
        user,
      });

      const result = await controller.login({ email: 'test@test.com', password: 'password' }, res, req);

      expect(res.cookie).toHaveBeenCalledWith('access_token', 'access', expect.any(Object));
      expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'refresh', expect.any(Object));
      expect(result).toEqual({ user });
    });
  });

  describe('logout', () => {
    it('should clear cookies', async () => {
      const res = mockResponse();
      await controller.logout(res);
      expect(res.clearCookie).toHaveBeenCalledWith('access_token', expect.any(Object));
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', expect.any(Object));
    });
  });
});
