import { useEffect } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { familyRef } from '@/lib/firestore.refs';
import { useAuthStore } from '@/stores/auth.store';

export function useFamily(): void {
  const { family, setFamily } = useAuthStore();

  useEffect(() => {
    if (!family?.id) return;

    const unsub = onSnapshot(familyRef(family.id), (snap) => {
      if (snap.exists()) {
        setFamily({ ...snap.data(), id: snap.id });
      }
    });

    return () => unsub();
  }, [family?.id]);
}
