import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../common/redis/redis.module';
import type Redis from 'ioredis';
import { EmailService } from '@/common/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    @Inject(REDIS_CLIENT) private redis: Redis,
    private email: EmailService,

  ) { }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email ya registrado');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.usuario.create({
      data: {
        email: dto.email,
        passwordHash,
        nombre: dto.nombre,
        apellidos: dto.apellidos,
      },
      select: { id: true, email: true, nombre: true, apellidos: true, role: true, plan: true },
    });

    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (!user || !user.active) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.despachoId);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    // Update last login
    await this.prisma.usuario.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return { user: { id: user.id, email: user.email, nombre: user.nombre, apellidos: user.apellidos, role: user.role, plan: user.plan, despachoId: user.despachoId }, ...tokens };
  }

  async refresh(userId: string, refreshToken: string) {
    const hash = await this.redis.get(`refresh:${userId}`);
    if (!hash) throw new ForbiddenException('Acceso denegado');

    const valid = await bcrypt.compare(refreshToken, hash);
    if (!valid) throw new ForbiddenException('Token de refresco inválido');

    const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException('Acceso denegado');

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.despachoId);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string) {
    await this.redis.del(`refresh:${userId}`);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async generateTokens(userId: string, email: string, role: string, despachoId: string | null) {
    const payload = { sub: userId, email, role, despachoId};

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }
  private async saveRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    const ttl = 60 * 60 * 24 * 7; // 7 días en segundos
    await this.redis.set(`refresh:${userId}`, hash, 'EX', ttl);
  }

  async getMe(userId: string) {
    return this.prisma.usuario.findUnique({
      where: { id: userId },
      select: { id: true, email: true, nombre: true, apellidos: true, role: true, plan: true },
    });
  }

  async forgotPassword(emailAddress: string) {
    const user = await this.prisma.usuario.findUnique({ where: { email: emailAddress } });
    // Siempre respondemos igual aunque el email no exista (evita user enumeration)
    if (!user) return;

    const token = crypto.randomUUID();
    await this.redis.set(`reset:${token}`, user.id, 'EX', 60 * 30); // 30 minutos

    await this.email.sendPasswordReset(emailAddress, token);
  }

  async resetPassword(token: string, newPassword: string) {
    const userId = await this.redis.get(`reset:${token}`);
    if (!userId) throw new ForbiddenException('Token inválido o expirado');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.usuario.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.redis.del(`reset:${token}`);
  }

  async activarCuenta(token: string, password: string) {
    const email = await this.redis.get(`invite:${token}`);
    if (!email) throw new ForbiddenException('Token inválido o expirado');

    const passwordHash = await bcrypt.hash(password, 12);

    await this.prisma.usuario.update({
      where: { email },
      data: { passwordHash, active: true },
    });

    await this.redis.del(`invite:${token}`);
  }
}
