import type { Timestamp } from 'firebase/firestore';

export type CategoryType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;           // Emoji (ex: '🏠') ou nome de ícone
  color: string;          // Hex — usado nos gráficos de pizza
  budgetCents?: number;   // Orçamento mensal opcional; inteiro em centavos
  isDefault: boolean;     // true = seed do sistema; false = criado pelo usuário
  createdAt: Timestamp;
}

// Categorias que surgem automaticamente ao criar uma família
export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'id' | 'createdAt'>[] = [
  { name: 'Moradia',       type: 'expense', icon: '🏠', color: '#6C63FF', isDefault: true },
  { name: 'Alimentação',   type: 'expense', icon: '🛒', color: '#FF8C42', isDefault: true },
  { name: 'Transporte',    type: 'expense', icon: '🚗', color: '#4FC3F7', isDefault: true },
  { name: 'Saúde',         type: 'expense', icon: '❤️',  color: '#FF5C7D', isDefault: true },
  { name: 'Lazer',         type: 'expense', icon: '🎮', color: '#AB47BC', isDefault: true },
  { name: 'Assinaturas',   type: 'expense', icon: '📱', color: '#26A69A', isDefault: true },
  { name: 'Educação',      type: 'expense', icon: '📚', color: '#42A5F5', isDefault: true },
  { name: 'Outros',        type: 'expense', icon: '📦', color: '#78909C', isDefault: true },
];

export const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'id' | 'createdAt'>[] = [
  { name: 'Salário',   type: 'income', icon: '💼', color: '#00D4A0', isDefault: true },
  { name: 'Freelance', type: 'income', icon: '💻', color: '#29B6F6', isDefault: true },
  { name: 'Outros',    type: 'income', icon: '💰', color: '#66BB6A', isDefault: true },
];
