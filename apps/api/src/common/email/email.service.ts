import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private resend: Resend | null = null;
  private logoBase64: string;

  constructor(private config: ConfigService) {
    const resendApiKey = this.config.get<string>('RESEND_API_KEY');
    if (resendApiKey) {
      this.resend = new Resend(resendApiKey);
    } else {
      this.transporter = nodemailer.createTransport({
        host: this.config.get('SMTP_HOST', 'localhost'),
        port: this.config.get<number>('SMTP_PORT', 1025),
        secure: false,
        auth: this.config.get('SMTP_USER')
          ? { user: this.config.get('SMTP_USER'), pass: this.config.get('SMTP_PASS') }
          : undefined,
      });
    }
    const logoPath = path.join(process.cwd(), '..', 'web', 'public', 'icono.png');
    try {
      const logoBuffer = fs.readFileSync(logoPath);
      this.logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    } catch {
      this.logoBase64 = '';
    }
  }

  private async send(to: string, subject: string, html: string) {
    const from = this.config.get('SMTP_FROM', 'LegalFlow <noreply@legalflow.local>');
    if (this.resend) {
      await this.resend.emails.send({ from, to, subject, html });
    } else {
      await this.transporter!.sendMail({ from, to, subject, html });
    }
  }

  async sendPasswordReset(email: string, token: string) {
    const baseUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    const url = `${baseUrl}/reset-password?token=${token}`;

    await this.send(
      email,
      'Restablecer contraseña — Merino & Vaskovska Abogados',
      `
      <!DOCTYPE html>
      <html lang="es">
      <body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 0;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
              
<tr>
  <td style="background-color:#1e3a5f;padding:28px 40px;text-align:center;">
    ${this.logoBase64
          ? `<img src="${this.logoBase64}" alt="icono" style="height:48px;margin-bottom:10px;display:block;margin-left:auto;margin-right:auto;" />`
          : ''
        }
    <div style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:2px;line-height:1.3;">
      MERINO &amp; VASKOVSKA
    </div>
    <div style="color:#cbd5e1;font-size:12px;font-weight:600;letter-spacing:4px;margin-top:2px;">
      ABOGADOS
    </div>
  </td>
</tr>

              <tr>
                <td style="padding:40px;">
                  <p style="margin:0 0 16px;font-size:16px;color:#111827;">Hola,</p>
                  <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
                    Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.
                    El enlace expirará en <strong>30 minutos</strong>.
                  </p>

                  <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                    <tr>
                      <td style="background-color:#1e3a5f;border-radius:6px;">
                        <a href="${url}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;letter-spacing:0.3px;">
                          Restablecer contraseña
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
                    Si no has solicitado este cambio, puedes ignorar este correo.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="background-color:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;">
                    Merino &amp; Vaskovska Abogados · Este es un mensaje automático, por favor no respondas a este correo.
                  </p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `
    );
  }

  async sendInvitation(email: string, nombre: string, token: string) {
    const baseUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    const url = `${baseUrl}/activar-cuenta?token=${token}`;

    await this.send(
      email,
      'Bienvenido a Merino & Vaskovska Abogados — Activa tu cuenta',
      `
      <!DOCTYPE html>
      <html lang="es">
      <body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 0;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
              
              <!-- Cabecera -->
<tr>
  <td style="background-color:#1e3a5f;padding:28px 40px;text-align:center;">
    ${this.logoBase64
          ? `<img src="${this.logoBase64}" alt="icono" style="height:48px;margin-bottom:10px;display:block;margin-left:auto;margin-right:auto;" />`
          : ''
        }
    <div style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:2px;line-height:1.3;">
      MERINO &amp; VASKOVSKA
    </div>
    <div style="color:#cbd5e1;font-size:12px;font-weight:600;letter-spacing:4px;margin-top:2px;">
      ABOGADOS
    </div>
  </td>
</tr>

              <!-- Cuerpo -->
              <tr>
                <td style="padding:40px;">
                  <p style="margin:0 0 16px;font-size:16px;color:#111827;">Hola <strong>${nombre}</strong>,</p>
                  <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
                    Tu despacho de abogados te ha dado acceso al <strong>portal de clientes de Merino &amp; Vaskovska Abogados</strong>.
                    Desde allí podrás consultar el estado de tus expedientes y mantenerte informado en todo momento.
                  </p>
                  <p style="margin:0 0 32px;font-size:15px;color:#374151;line-height:1.6;">
                    Para activar tu cuenta, haz clic en el botón. El enlace expirará en <strong>48 horas</strong>.
                  </p>

                  <!-- Botón -->
                  <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                    <tr>
                      <td style="background-color:#1e3a5f;border-radius:6px;">
                        <a href="${url}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;letter-spacing:0.3px;">
                          Activar mi cuenta
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
                    Si no esperabas este correo, puedes ignorarlo sin problema.
                  </p>
                </td>
              </tr>

              <!-- Pie -->
              <tr>
                <td style="background-color:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;">
                    Merino &amp; Vaskovska Abogados · Este es un mensaje automático, por favor no respondas a este correo.
                  </p>
                </td>
              </tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `);
  }

}
