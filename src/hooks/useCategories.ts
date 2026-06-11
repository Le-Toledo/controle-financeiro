import { useState, useEffect, useRef } from 'react';
import {
  onSnapshot, orderBy, query,
  doc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { categoriesCol } from '@/lib/firestore.refs';
import { useAuthStore } from '@/stores/auth.store';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '@shared/types/category';
import type { Category } from '@shared/types/category';

interface UseCategoriesResult {
  categories: Category[];
  loading:    boolean;
}

export function useCategories(): UseCategoriesResult {
  const familyId = useAuthStore((s) => s.family?.id);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const seededRef = useRef(false);

  useEffect(() => {
    if (!familyId || !auth.currentUser) {
      setLoading(false);
      return;
    }

    seededRef.current = false;

    const q = query(categoriesCol(familyId), orderBy('type'), orderBy('name'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.empty && !seededRef.current) {
          // No categories exist yet — seed defaults now (recovery path)
          seededRef.current = true;
          const allDefaults = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
          Promise.all(
            allDefaults.map((cat) => {
              const catRef = doc(categoriesCol(familyId));
              return setDoc(catRef, { ...cat, id: catRef.id, createdAt: serverTimestamp() });
            }),
          ).catch((err: unknown) => {
            const e = err as { code?: string; message?: string };
            console.error('[useCategories] auto-seed error:', e.code, e.message);
            setLoading(false);
          });
          // Don't set loading=false yet — next snapshot delivers the seeded docs
          return;
        }
        setCategories(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
        setLoading(false);
      },
      (err) => {
        console.error('[useCategories] snapshot error:', err.code, err.message);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [familyId]);

  return { categories, loading };
}
