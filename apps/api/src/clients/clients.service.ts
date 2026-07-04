import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EmailService } from '../common/email/email.service';
import { CreateClienteDto, UpdateClienteDto } from './dto/cliente.dto';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../common/redis/redis.module';
import type Redis from 'ioredis';
import * as crypto from 'crypto';

@Injectable()
export class ClientesService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) { }

  findAll(despachoId: string) {
    return this.prisma.cliente.findMany({
      where: { despachoId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, despachoId: string) {
    const item = await this.prisma.cliente.findFirst({
      where: { id, despachoId },
    });
    if (!item) throw new NotFoundException('Cliente no encontrado');
    return item;
  }

  async create(despachoId: string, creadoPorId: string, data: CreateClienteDto) {
    let usuarioId: string | undefined;

    if (data.email) {
      const existing = await this.prisma.usuario.findUnique({
        where: { email: data.email },
      });

      if (existing) {
        usuarioId = existing.id;
      } else {
        const nuevoUsuario = await this.prisma.usuario.create({
          data: {
            email: data.email,
            nombre: data.nombre,
            apellidos: data.apellidos ?? '',
            passwordHash: '',
            role: 'CLIENTE',
            active: false,
            rolDespacho: null,
          },
        });
        usuarioId = nuevoUsuario.id;

        const token = crypto.randomUUID();
        const ttl = 60 * 60 * 48;
        await this.redis.set(`invite:${token}`, data.email, 'EX', ttl);
        await this.email.sendInvitation(data.email, data.nombre, token);
      }
    }

    return this.prisma.cliente.create({
      data: { ...data, despachoId, creadoPorId, usuarioId },
    });
  }

  async update(id: string, despachoId: string, data: UpdateClienteDto) {
    await this.findOne(id, despachoId);
    return this.prisma.cliente.update({ where: { id }, data });
  }

  async remove(id: string, despachoId: string) {
    await this.findOne(id, despachoId);
    return this.prisma.cliente.delete({ where: { id } });
  }
}