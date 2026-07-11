'use client';
import { useState, useRef, useEffect } from 'react';
import { aiApi } from '@/lib/api';
import { Bot, User, Send, BookOpen, Navigation } from 'lucide-react';

type ChatType = 'NAVEGACION' | 'JURISPRUDENCIA';

interface Message { role: 'user' | 'assistant'; content: string }

export default function AiPage() {
  const [type, setType] = useState<ChatType>('NAVEGACION');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversacionId, setConversacionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const fn = type === 'NAVEGACION' ? aiApi.navegacion : aiApi.jurisprudencia;
      const { data } = await fn({ message: userMsg, conversacionId });
      setConversacionId(data.conversacionId);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error al procesar tu consulta. Inténtalo de nuevo.' }]);
    } finally {
      setLoading(false);
    }
  };

  const switchType = (t: ChatType) => {
    setType(t);
    setMessages([]);
    setConversacionId(null);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Asistente Legal</h1>
        <div className="flex gap-1 ml-auto border rounded-lg p-1 bg-white">
          <button onClick={() => switchType('NAVEGACION')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${type === 'NAVEGACION' ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-900'}`}>
            <Navigation className="w-3 h-3" /> Navegación
          </button>
          <button onClick={() => switchType('JURISPRUDENCIA')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${type === 'JURISPRUDENCIA' ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-900'}`}>
            <BookOpen className="w-3 h-3" /> Jurisprudencia
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white rounded-xl border overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <Bot className="w-10 h-10" />
            <p className="text-sm">{type === 'NAVEGACION' ? 'Pregúntame cómo usar LegalFlow Digital' : 'Consulta jurisprudencia española'}</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-brand-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
              {m.content}
            </div>
            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-gray-500" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={type === 'NAVEGACION' ? '¿Cómo creo un expediente?' : '¿Qué dice el TS sobre la cláusula suelo?'}
          className="flex-1 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button onClick={send} disabled={!input.trim() || loading} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-3 rounded-xl disabled:opacity-50 transition-colors">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
