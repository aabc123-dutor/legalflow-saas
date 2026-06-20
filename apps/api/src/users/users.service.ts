import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
      select: { id: true, email: true, nombre: true, apellidos: true, role: true, plan: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async updateProfile(id: string, data: { nombre?: string; apellidos?: string }) {
    return this.prisma.usuario.update({ where: { id }, data, select: { id: true, nombre: true, apellidos: true, email: true } });
  }

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.usuario.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new Error('Contraseña actual incorrecta');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.usuario.update({ where: { id }, data: { passwordHash } });
    return { message: 'Contraseña actualizada correctamente' };
  }
}
