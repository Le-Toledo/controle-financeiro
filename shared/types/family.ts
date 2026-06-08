import type { Timestamp } from 'firebase/firestore';

export type Plan = 'free' | 'premium';

export interface Family {
  id: string;
  name: string;
  currency: 'BRL';
  timezone: 'America/Sao_Paulo';
  ownerId: string;
  members: string[];      // UIDs — usado diretamente nas regras Firestore
  plan: Plan;
  inviteCode: string;     // 8 chars maiúsculos; rotaciona a cada novo membro
  createdAt: Timestamp;
}
