import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { onSnapshot, query, where, limit } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { familiesCol } from '@/lib/firestore.refs';
import { useAuthStore } from '@/stores/auth.store';

export function useAuth(): void {
  const { setUser, setFamily, setLoading, setHydrated } = useAuthStore();

  useEffect(() => {
    let unsubFamily: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubFamily) {
        unsubFamily();
        unsubFamily = null;
      }

      setUser(user);
      setHydrated(true);

      if (!user) {
        setFamily(null);
        setLoading(false);
        return;
      }

      const q = query(familiesCol(), where('members', 'array-contains', user.uid), limit(1));
      unsubFamily = onSnapshot(
        q,
        (snap) => {
          if (snap.empty) {
            setFamily(null);
          } else {
            const docSnap = snap.docs[0];
            setFamily({ ...docSnap.data(), id: docSnap.id });
          }
          setLoading(false);
        },
        (err) => {
          // Dispara se as regras do Firestore bloquearem a query
          console.error('[useAuth] family snapshot error:', err.code, err.message);
          setFamily(null);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubAuth();
      if (unsubFamily) unsubFamily();
    };
  }, []);
}
