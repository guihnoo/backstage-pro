// UTILITÁRIOS CENTRALIZADOS PARA MANIPULAÇÃO DE DATAS
// ÚNICA fonte de verdade para todas as operações de data no sistema

import {
  format,
  isValid,
  startOfMonth,
  addDays,
  startOfWeek,
  differenceInDays
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Normaliza qualquer valor de data para o formato padrão YYYY-MM-DD
 * Esta é a ÚNICA função que deve ser usada para normalizar datas no sistema
 */
export const normalizeDateString = (dateValue) => {
  if (!dateValue) return '';
  
  try {
    // Se já é uma string no formato correto
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // Se contém 'T' ou 'Z', é um datetime ISO
    if (typeof dateValue === 'string' && (dateValue.includes('T') || dateValue.includes('Z'))) {
      return dateValue.split('T')[0];
    }
    
    // Se é um objeto Date
    if (dateValue instanceof Date) {
      if (!isValid(dateValue)) {
        console.error('❌ Data inválida:', dateValue);
        return format(new Date(), 'yyyy-MM-dd');
      }
      return format(dateValue, 'yyyy-MM-dd');
    }
    
    // Tentar parsear como string
    const parsed = new Date(dateValue);
    if (!isValid(parsed)) {
      console.error('❌ Não foi possível parsear data:', dateValue);
      return format(new Date(), 'yyyy-MM-dd');
    }
    
    return format(parsed, 'yyyy-MM-dd');
  } catch (error) {
    console.error('❌ Erro ao normalizar data:', dateValue, error);
    return format(new Date(), 'yyyy-MM-dd');
  }
};

/**
 * Converte uma string de data normalizada para um objeto Date no fuso horário local
 */
export const stringToLocalDate = (dateString) => {
  if (!dateString) return new Date();
  const normalized = normalizeDateString(dateString);
  if (!normalized) return new Date();
  return new Date(normalized + 'T00:00:00');
};

/**
 * Verifica se duas datas são do mesmo dia
 */
export const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  const normalized1 = normalizeDateString(date1);
  const normalized2 = normalizeDateString(date2);
  return normalized1 === normalized2;
};

/**
 * Data de hoje no fuso local (YYYY-MM-DD). Preferir em vez de toISOString().split('T')[0] (UTC).
 */
export const todayLocalISO = () => format(new Date(), 'yyyy-MM-dd');

/**
 * Verifica se uma data é hoje
 */
export const isToday = (dateValue) => {
  const today = todayLocalISO();
  const normalized = normalizeDateString(dateValue);
  return normalized === today;
};

/**
 * Formata data para exibição
 */
export const formatDisplayDate = (dateValue, formatString = 'dd/MM/yyyy') => {
  if (!dateValue) return '';
  try {
    const date = stringToLocalDate(dateValue);
    return format(date, formatString, { locale: ptBR });
  } catch (error) {
    console.error('❌ Erro ao formatar data:', dateValue, error);
    return '';
  }
};

/**
 * Formata data por extenso
 */
export const formatFullDate = (dateValue) => {
  return formatDisplayDate(dateValue, "dd 'de' MMMM 'de' yyyy");
};

/**
 * Formata data com dia da semana
 */
export const formatDateWithWeekday = (dateValue) => {
  return formatDisplayDate(dateValue, "eeee, dd/MM/yyyy");
};

/**
 * Formata data compacta (dd/MM)
 */
export const formatShortDate = (dateValue) => {
  return formatDisplayDate(dateValue, 'dd/MM');
};

/**
 * Calcula diferença em dias entre duas datas
 */
export const daysDifference = (startDate, endDate) => {
  try {
    const start = stringToLocalDate(startDate);
    const end = stringToLocalDate(endDate);
    return differenceInDays(end, start) + 1;
  } catch (error) {
    console.error('❌ Erro ao calcular diferença de dias:', error);
    return 1;
  }
};

/**
 * Verifica se uma data está entre duas outras (inclusivo)
 */
export const isDateBetween = (dateToCheck, startDate, endDate) => {
  try {
    const check = normalizeDateString(dateToCheck);
    const start = normalizeDateString(startDate);
    const end = normalizeDateString(endDate);
    return check >= start && check <= end;
  } catch {
    return false;
  }
};

/**
 * Obtém o status REAL de um evento baseado em suas datas
 * ÚNICA função para determinar status de eventos
 */
export const getEventStatus = (event) => {
  if (!event?.start_date || !event?.end_date) return 'scheduled';
  if (event.status === 'cancelled') return 'cancelled';

  try {
    const today = todayLocalISO();
    const eventStartStr = normalizeDateString(event.start_date);
    const eventEndStr = normalizeDateString(event.end_date);
    
    if (!eventStartStr || !eventEndStr) {
      return event.status || 'scheduled';
    }

    // Status manual tem prioridade
    if (event.status === 'completed' || event.status === 'archived') {
      return event.status;
    }
    
    // Status baseado na data
    if (today < eventStartStr) {
      return 'scheduled';
    } else if (today >= eventStartStr && today <= eventEndStr) {
      return 'in_progress';
    } else if (today > eventEndStr) {
      return 'completed';
    }
    
    return event.status || 'scheduled';
  } catch (error) {
    console.error('❌ Erro ao calcular status do evento:', error);
    return event.status || 'scheduled';
  }
};

/**
 * Obtém o status traduzido
 */
export const getEventStatusLabel = (event) => {
  const status = getEventStatus(event);
  const statusLabels = {
    'scheduled': 'Agendado',
    'in_progress': 'Em Andamento', 
    'completed': 'Concluído',
    'archived': 'Arquivado'
  };
  return statusLabels[status] || 'Desconhecido';
};

/**
 * Obtém configuração de cor e ícone para status
 */
export const getEventStatusConfig = (event) => {
  const status = getEventStatus(event);
  
  const configs = {
    'scheduled': {
      color: 'bg-[var(--bp-primary)]',
      textColor: 'bp-text-primary',
      bgColor: 'bp-today-surface-soft',
      borderColor: 'border-[color-mix(in_srgb,var(--bp-primary)_30%,transparent)]',
      badgeClass: 'bp-chip-badge-active',
      label: 'Agendado'
    },
    'in_progress': {
      color: 'text-amber-400', 
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/30',
      badgeClass: 'bg-amber-100 text-amber-800',
      label: 'Em Andamento'
    },
    'completed': {
      color: 'text-green-400',
      bgColor: 'bg-green-500/20', 
      borderColor: 'border-green-500/30',
      badgeClass: 'bg-green-100 text-green-800',
      label: 'Concluído'
    },
    'archived': {
      color: 'text-slate-400',
      bgColor: 'bg-slate-500/20',
      borderColor: 'border-slate-500/30', 
      badgeClass: 'bg-slate-100 text-slate-800',
      label: 'Arquivado'
    }
  };
  
  return configs[status] || configs['scheduled'];
};

/**
 * Valida se uma string está no formato de data correto
 */
export const isValidDateString = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return false;
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(dateString)) return false;
  const date = new Date(dateString + 'T00:00:00');
  return isValid(date);
};

/**
 * Filtra eventos por data
 */
export const getEventsForDate = (events, targetDate) => {
  if (!Array.isArray(events) || !targetDate) return [];
  const target = normalizeDateString(targetDate);
  return events.filter(event => {
    if (!event?.start_date || !event?.end_date) return false;
    const start = normalizeDateString(event.start_date);
    const end = normalizeDateString(event.end_date);
    return target >= start && target <= end;
  });
};

/**
 * Filtra trabalho diário por data
 */
export const getWorkForDate = (dailyWork, targetDate) => {
  if (!Array.isArray(dailyWork) || !targetDate) return null;
  const target = normalizeDateString(targetDate);
  return dailyWork.find(work => {
    if (!work?.date) return false;
    const workDate = normalizeDateString(work.date);
    return workDate === target;
  });
};

/** Conta dias únicos trabalhados (diárias) a partir de daily_work. */
export function countUniqueWorkDays(workRecords = []) {
  const days = new Set();
  for (const w of workRecords) {
    if (!w?.date) continue;
    const d = normalizeDateString(w.date);
    if (d) days.add(d);
  }
  return days.size;
}

/**
 * Ordena eventos por data
 */
export const sortEventsByDate = (events, direction = 'asc') => {
  if (!Array.isArray(events)) return [];
  return [...events].sort((a, b) => {
    const dateA = normalizeDateString(a.start_date);
    const dateB = normalizeDateString(b.start_date);
    return direction === 'desc' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
  });
};

/**
 * Cria matrix de 42 dias para calendário (6 semanas)
 */
export const monthMatrix = (date) => {
  const monthStart = startOfMonth(date);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 }); 
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  
  if (days.length < 42) {
    const lastDay = days[days.length - 1];
    const diff = 42 - days.length;
    for (let i = 1; i <= diff; i++) {
      days.push(addDays(lastDay, i));
    }
  }
  
  return days.slice(0, 42);
};

/**
 * Formata horário (HH:mm)
 */
export const formatTime = (timeString) => {
  if (!timeString || typeof timeString !== 'string' || !timeString.includes(':')) return '';
  return timeString.slice(0, 5);
};

/**
 * Cria label curto para evento
 */
export const shortEventLabel = (event, clientName = '') => {
  if (!event) return "Evento";
  const time = event.call_time || event.start_time;
  const formattedTime = time ? formatTime(time) : "";
  const name = clientName || "Cliente";
  if (formattedTime && name) return `${name} • ${formattedTime}`;
  return name || formattedTime || "Evento";
};

/**
 * Cria label de intervalo de tempo
 */
export const timeRangeLabel = (event) => {
  if (!event) return "";
  const start = event.call_time || event.start_time;
  const end = event.end_time;
  const formattedStart = start ? formatTime(start) : "";
  const formattedEnd = end ? formatTime(end) : "";
  if (formattedStart && formattedEnd) return `${formattedStart}–${formattedEnd}`;
  return formattedStart || formattedEnd || "";
};

/**
 * Retorna cor de contraste para texto
 */
export const getContrastColor = (hex) => {
  if (!hex) return '#FFFFFF';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#020617' : '#FFFFFF';
};

/**
 * Cria versão suave de cor
 */
export const softColor = (hex, alpha = 0.18) => {
  if (!hex || hex.length < 7) return `rgba(34, 211, 238, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Constantes de formato
 */
export const DATE_FORMATS = {
  STORAGE: 'yyyy-MM-dd',
  DISPLAY: 'dd/MM/yyyy',
  FULL: "dd 'de' MMMM 'de' yyyy",
  SHORT: 'dd/MM',
  WEEKDAY: 'eeee, dd/MM/yyyy'
};