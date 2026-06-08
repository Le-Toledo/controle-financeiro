// Centavos são sempre inteiros. Conversão para float só aqui, só para exibição.

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style:    'currency',
    currency: 'BRL',
  });
}

export function formatCentsAmount(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Converte string de dígitos do keypad para display "XX,XX"
// digits="1999" → "19,99"
export function digitsToDisplay(digits: string): string {
  const num = parseInt(digits || '0', 10);
  return formatCentsAmount(num);
}

// Converte string de dígitos para centavos (int)
export function digitsToCents(digits: string): number {
  return parseInt(digits || '0', 10);
}

// Append de dígito no keypad (máx 7 dígitos = R$ 99.999,99)
export function appendDigit(current: string, digit: string): string {
  if (current.length >= 7) return current;
  const next = current + digit;
  return next.replace(/^0+/, '') || '0';
}

export function removeDigit(current: string): string {
  return current.slice(0, -1);
}
