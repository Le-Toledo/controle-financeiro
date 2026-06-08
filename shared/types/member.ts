import type { Timestamp } from 'firebase/firestore';

export type MemberRole = 'owner' | 'member';

export interface FamilyMember {
  id: string;           // Igual ao UID do Firebase Auth
  role: MemberRole;
  displayName: string;
  avatarColor: string;  // Hex — fallback quando não há foto de perfil
  joinedAt: Timestamp;
}
