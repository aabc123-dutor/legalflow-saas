import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AiService {
  private client: Anthropic;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.client = new Anthropic({ apiKey: this.config.get('ANTHROPIC_API_KEY') });
  }

  // ── Chatbot de navegación ──────────────────────────────────────────────────

  async navegacionChat(despachoId: string, creadoPorId:string, conversacionId: string | null, message: string) {
    // Get or create conversation
    let conv = conversacionId
      ? await this.prisma.conversacion.findFirst({
          where: { id: conversacionId, despachoId, creadoPorId },
          include: { mensajes: { orderBy: { createdAt: 'asc' } } },
        })
      : null;

    if (!conv) {
      conv = await this.prisma.conversacion.create({
        data: { despachoId, creadoPorId, tipo: 'NAVEGACION', titulo: message.slice(0, 60) },
        include: { mensajes: true },
      });
    }

    // Save user message
    await this.prisma.mensaje.create({
      data: { conversacionId: conv.id, role: 'user', content: message },
    });

    // Build history for Claude
    const history = conv.mensajes.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
    history.push({ role: 'user', content: message });

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: `Eres el asistente de navegación de LegalFlow Digital, una plataforma SaaS para abogados y pequeños despachos.
Ayudas a los usuarios a navegar la aplicación, entender sus funcionalidades y resolver dudas operativas.
Responde siempre en español, de forma concisa y profesional.
Funcionalidades disponibles: Expedientes, Clientes, Documentos, Facturación, Dashboard Fiscal (Modelo 303/130), Chatbot de jurisprudencia.`,
      messages: history,
    });

    const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : '';

    // Save assistant message
    await this.prisma.mensaje.create({
      data: { conversacionId: conv.id, role: 'assistant', content: assistantMessage },
    });

    return { conversacionId: conv.id, message: assistantMessage };
  }

  // ── Chatbot de jurisprudencia (RAG) ───────────────────────────────────────

  async jurisprudenciaChat(despachoId: string, creadoPorId: string, conversacionId: string | null, query: string) {
    // Retrieve relevant jurisprudence (simplified — use pgvector for production)
    const relevant = await this.prisma.jurisprudenciaBase.findMany({
      where: {
        OR: [
          { titulo: { contains: query, mode: 'insensitive' } },
          { resumen: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
    });

    const context = relevant
      .map((j) => `## ${j.titulo}\nTribunal: ${j.tribunal ?? 'N/A'} | Fecha: ${j.fecha?.toISOString().slice(0, 10) ?? 'N/A'}\n${j.resumen}`)
      .join('\n\n---\n\n');

    // Get or create conversation
    let conv = conversacionId
      ? await this.prisma.conversacion.findFirst({
          where: { id: conversacionId, despachoId, creadoPorId },
          include: { mensajes: { orderBy: { createdAt: 'asc' } } },
        })
      : null;

    if (!conv) {
      conv = await this.prisma.conversacion.create({
        data: { despachoId, creadoPorId,  tipo: 'JURISPRUDENCIA', titulo: query.slice(0, 60) },
        include: { mensajes: true },
      });
    }

    await this.prisma.mensaje.create({
      data: { conversacionId: conv.id, role: 'user', content: query },
    });

    const history = conv.mensajes.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
    history.push({ role: 'user', content: query });

    const systemPrompt = `Eres un asistente legal especializado en jurisprudencia española.
Responde basándote ÚNICAMENTE en la jurisprudencia proporcionada en el contexto.
Si no encuentras información relevante, indícalo claramente.
Siempre cita la fuente (tribunal y fecha) al referenciar una sentencia.
Responde en español, con rigor jurídico.

JURISPRUDENCIA DISPONIBLE:
${context || 'No se encontraron documentos relevantes para esta consulta.'}`;

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system: systemPrompt,
      messages: history,
    });

    const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : '';

    await this.prisma.mensaje.create({
      data: { conversacionId: conv.id, role: 'assistant', content: assistantMessage },
    });

    return {
      conversacionId: conv.id,
      message: assistantMessage,
      sourcesFound: relevant.length,
    };
  }

  // ── Historial de conversaciones ───────────────────────────────────────────

  getConversaciones(despachoId: string, creadoPorId:string, tipo?: 'NAVEGACION' | 'JURISPRUDENCIA') {
    return this.prisma.conversacion.findMany({
      where: { despachoId, creadoPorId, ...(tipo && { tipo }) },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, tipo: true, titulo: true, updatedAt: true },
    });
  }

  getConversacion(id: string, despachoId: string, creadoPorId:string,) {
    return this.prisma.conversacion.findFirst({
      where: { id, despachoId, creadoPorId },
      include: { mensajes: { orderBy: { createdAt: 'asc' } } },
    });
  }
}
