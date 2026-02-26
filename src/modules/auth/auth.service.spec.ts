import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockUsersService = {
      findByEmailForAuth: jest.fn(),
    };
    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  it('should throw an error when user is not found', async () => {
    usersService.findByEmailForAuth.mockResolvedValue(null);

    await expect(
      service.login({ email: 'test@vet.com', password: 'password123' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw an error when password does not match', async () => {
    const mockUser: any = {
      id: 1,
      email: 'test@vet.com',
      passwordHash: 'hashedpassword',
      isActive: true,
      roles: [],
    };
    usersService.findByEmailForAuth.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login({ email: 'test@vet.com', password: 'wrongpassword' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should return a token and user payload when validation is successful', async () => {
    const mockUser: any = {
      id: 1,
      name: 'João',
      email: 'test@vet.com',
      passwordHash: 'hashedpassword',
      isActive: true,
      roles: [],
    };
    usersService.findByEmailForAuth.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    jwtService.sign.mockReturnValue('valid_token');

    const result = await service.login({
      email: 'test@vet.com',
      password: 'correctpassword',
    });

    expect(result).toEqual({
      access_token: 'valid_token',
      user: {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        roles: mockUser.roles,
      },
    });
  });
});
