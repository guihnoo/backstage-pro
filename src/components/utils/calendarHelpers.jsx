import { normalizeDateString, isSameDay } from './dateUtils';
import {
  startOfWeek,
  addDays,
  max,
  min,
  startOfDay
} from 'date-fns';

/**
 * Normaliza um evento para usar datas locais precisas.
 */
export const normalizeEventForGrid = (event, clients = []) => {
  if (!event || !event.start_date || !event.end_date) return null;

  const startLocal = startOfDay(new Date(normalizeDateString(event.start_date) + 'T00:00:00'));
  const endLocal = startOfDay(new Date(normalizeDateString(event.end_date) + 'T00:00:00'));
  const endExclusive = addDays(endLocal, 1);
  
  if (endExclusive.getTime() <= startLocal.getTime()) {
    console.error('Evento com duração inválida corrigido para 1 dia:', event);
    return {
      ...event,
      startLocal,
      endExclusive: addDays(startLocal, 1),
      isAllDay: true,
    };
  }
  
  // CRÍTICO: Encontrar o nome do cliente para exibição
  const getClientName = (clientId) => {
    if (!Array.isArray(clients) || clients.length === 0) {
      return event.title || 'Evento';
    }
    const client = clients.find(c => c && c.id === clientId);
    return client ? client.name : (event.title || 'Evento');
  };
  
  return {
    ...event,
    startLocal,
    endExclusive,
    isAllDay: true,
    client_id: event.client_id,
    // Adicionar o nome do cliente para exibição
    displayName: getClientName(event.client_id),
  };
};

/**
 * Não agrupa eventos. Cada evento é um bloco.
 */
export const groupContinuousEvents = (normalizedEvents) => {
  if (!Array.isArray(normalizedEvents) || normalizedEvents.length === 0) return [];

  return normalizedEvents.map(event => ({
    idRaiz: event.id,
    seriesId: event.series_id,
    start: event.startLocal,
    end: event.endExclusive,
    color: event.color || '#A78BFA',
    title: event.displayName || event.title || 'Evento',
    client_id: event.client_id,
    events: [event],
    label: event.displayName || event.title || 'Evento'
  }));
};

/**
 * Quebra um bloco em segmentos por semana com cálculo de coluna preciso.
 */
export const splitBlockIntoWeekSpans = (block, weekRowStartDate) => {
  const weekStart = startOfWeek(weekRowStartDate, { weekStartsOn: 0 });
  const weekEnd = addDays(weekStart, 7);
  
  if (block.start >= weekEnd || block.end <= weekStart) return [];

  const spanStart = max([block.start, weekStart]);
  const spanEnd = min([block.end, weekEnd]);
  
  if (spanStart >= spanEnd) return [];

  const startDayOfWeek = spanStart.getDay();
  const endDayOfWeek = addDays(spanEnd, -1).getDay();

  const colStart = startDayOfWeek + 1;
  const colEnd = endDayOfWeek + 2;

  return [{
    block,
    colStart,
    colEnd,
    roundedLeft: isSameDay(spanStart, block.start),
    roundedRight: isSameDay(spanEnd, block.end),
  }];
};

/**
 * Aloca spans em lanes dinamicamente baseadas na largura da tela.
 */
export const assignLanes = (spans, screenWidth) => {
  let maxLanes = 3;
  if (screenWidth >= 1024) maxLanes = 5;
  else if (screenWidth >= 768) maxLanes = 4;
  
  const lanes = Array.from({ length: maxLanes }, () => []);
  const overflow = [];
  
  const sortedSpans = [...spans].sort((a,b) => (a.colStart - b.colStart) || ((b.colEnd - b.colStart) - (a.colEnd - a.colStart)));

  for (const span of sortedSpans) {
    let placed = false;
    for (let i = 0; i < maxLanes; i++) {
      const lastInLane = lanes[i].length > 0 ? lanes[i][lanes[i].length - 1] : null;
      if (!lastInLane || span.colStart >= lastInLane.colEnd) {
        lanes[i].push(span);
        placed = true;
        break;
      }
    }
    if (!placed) {
      overflow.push(span);
    }
  }
  return { lanes: lanes.filter(l => l.length > 0), overflow };
};