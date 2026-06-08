import {
  format,
  startOfMonth,
  endOfMonth,
  isToday,
  isYesterday,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import type { Transaction } from '@shared/types/transaction';

export function toDate(ts: Timestamp): Date {
  return ts.toDate();
}

// Range do mês para queries Firestore
export function getMonthRange(date: Date): { start: Timestamp; end: Timestamp } {
  return {
    start: Timestamp.fromDate(startOfMonth(date)),
    end:   Timestamp.fromDate(endOfMonth(date)),
  };
}

// "Hoje", "Ontem", "3 jun" ou "3 jun 2024"
export function formatRelativeDay(date: Date): string {
  if (isToday(date))     return 'Hoje';
  if (isYesterday(date)) return 'Ontem';
  const currentYear = new Date().getFullYear();
  if (date.getFullYear() === currentYear) {
    return format(date, "d 'de' MMM", { locale: ptBR });
  }
  return format(date, "d 'de' MMM yyyy", { locale: ptBR });
}

// "Junho 2025"
export function formatMonthLabel(date: Date): string {
  return format(date, "MMMM yyyy", { locale: ptBR });
}

// Capitaliza primeira letra
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Agrupa transações por chave de dia local (America/Sao_Paulo)
export function groupByDay(transactions: Transaction[]): Array<{
  dateKey: string;
  label:   string;
  items:   Transaction[];
}> {
  const map = new Map<string, { label: string; items: Transaction[] }>();

  for (const tx of transactions) {
    const date = tx.date.toDate();
    const key  = format(date, 'yyyy-MM-dd');
    if (!map.has(key)) {
      map.set(key, { label: formatRelativeDay(date), items: [] });
    }
    map.get(key)!.items.push(tx);
  }

  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0])) // mais recente primeiro
    .map(([dateKey, { label, items }]) => ({ dateKey, label, items }));
}

export function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

// Dia-do-mês com sufixo: "1º", "2", "15"
export function formatDueDay(day: number): string {
  return day === 1 ? '1º' : String(day);
}
