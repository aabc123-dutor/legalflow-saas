export function descargarICS(hito: { titulo: string; descripcion?: string; fecha: string }) {
  const fecha = new Date(hito.fecha);
  const pad = (n: number) => String(n).padStart(2, '0');

  const fechaStr = `${fecha.getUTCFullYear()}${pad(fecha.getUTCMonth() + 1)}${pad(fecha.getUTCDate())}`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `${Date.now()}@legalflow`;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LegalFlow Digital//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${fechaStr}`,
    `DTEND;VALUE=DATE:${fechaStr}`,
    `SUMMARY:${hito.titulo}`,
    hito.descripcion ? `DESCRIPTION:${hito.descripcion}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${hito.titulo.replace(/\s+/g, '_')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function urlGoogleCalendar(hito: { titulo: string; descripcion?: string; fecha: string }) {
  const fecha = new Date(hito.fecha);
  const pad = (n: number) => String(n).padStart(2, '0');
  const fechaStr = `${fecha.getUTCFullYear()}${pad(fecha.getUTCMonth() + 1)}${pad(fecha.getUTCDate())}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: hito.titulo,
    dates: `${fechaStr}/${fechaStr}`,
    details: hito.descripcion ?? '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}