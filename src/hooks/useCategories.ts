import { useState, useEffect } from 'react';
import { onSnapshot, orderBy, query } from 'firebase/firestore';
import { categoriesCol } from '@/lib/firestore.refs';
import { useAuthStore } from '@/stores/auth.store';
import type { Category } from '@shared/types/category';

interface UseCategoriesResult {
  categories: Category[];
  loading:    boolean;
}

export function useCategories(): UseCategoriesResult {
  const familyId = useAuthStore((s) => s.family?.id);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!familyId) return;

    const q = query(categoriesCol(familyId), orderBy('type'), orderBy('name'));
    const unsub = onSnapshot(q, (snap) => {
      setCategories(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
      setLoading(false);
    });

    return () => unsub();
  }, [familyId]);

  return { categories, loading };
}
