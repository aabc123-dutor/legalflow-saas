import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST', 'localhost'),
      port: this.config.get<number>('SMTP_PORT', 1025),
      secure: false,
      auth: this.config.get('SMTP_USER')
        ? {
            user: this.config.get('SMTP_USER'),
            pass: this.config.get('SMTP_PASS'),
          }
        : undefined,
    });
  }

  async sendPasswordReset(email: string, token: string) {
    const baseUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    const url = `${baseUrl}/reset-password?token=${token}`;

    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM', 'LegalFlow <noreply@legalflow.local>'),
      to: email,
      subject: 'Restablecer contraseña — Merino & Vaskovska Abogados',
      html: `
        <p>Has solicitado restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace. Expirará en 30 minutos:</p>
        <a href="${url}">${url}</a>
        <p>Si no has solicitado este cambio, ignora este email.</p>
      `,
    });
  }
}