'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Email inválido'),
});

type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    setError('');
    try {
      await api.post('/auth/forgot-password', data);
      setSent(true);
    } catch {
      setError('Ha ocurrido un error. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border p-8">
        <div className="mb-8 text-center">
          <img src="/logo.png" alt="Merino & Vaskovska Abogados" className="h-40 mx-auto mb-4" />
          <p className="text-sm text-gray-500">Recuperar contraseña</p>
        </div>

        {sent ? (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg text-center">
            Si el email existe, recibirás un enlace en los próximos minutos.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="tu@email.com"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg text-xs tracking-[2px] uppercase transition-colors disabled:opacity-60"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          <a href="/login" className="text-brand-600 hover:underline font-medium">
            Volver al login
          </a>
        </p>
      </div>
    </div>
  );
}