import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { Family } from '@shared/types/family';

interface AuthState {
  user:      User | null;
  family:    Family | null;
  loading:   boolean;
  hydrated:  boolean;   // true quando onAuthStateChanged disparou pela primeira vez

  setUser:    (user: User | null) => void;
  setFamily:  (family: Family | null) => void;
  setLoading: (loading: boolean) => void;
  setHydrated:(hydrated: boolean) => void;
  reset:      () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:     null,
  family:   null,
  loading:  true,
  hydrated: false,

  setUser:     (user)     => set({ user }),
  setFamily:   (family)   => set({ family }),
  setLoading:  (loading)  => set({ loading }),
  setHydrated: (hydrated) => set({ hydrated }),
  reset:       ()         => set({ user: null, family: null, loading: false }),
}));
