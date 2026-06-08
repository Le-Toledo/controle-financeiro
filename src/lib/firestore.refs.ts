import {
  collection,
  doc,
  type CollectionReference,
  type DocumentReference,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Family }        from '@shared/types/family';
import type { FamilyMember }  from '@shared/types/member';
import type { Category }      from '@shared/types/category';
import type { FixedExpense }  from '@shared/types/fixed-expense';
import type { Transaction }   from '@shared/types/transaction';
import type { MonthlyReport } from '@shared/types/monthly-report';

// Helpers tipados — evita strings soltas e erros de typo
export const familyRef = (familyId: string): DocumentReference<Family> =>
  doc(db, 'families', familyId) as DocumentReference<Family>;

export const familiesCol = (): CollectionReference<Family> =>
  collection(db, 'families') as CollectionReference<Family>;

export const membersCol = (familyId: string): CollectionReference<FamilyMember> =>
  collection(db, 'families', familyId, 'members') as CollectionReference<FamilyMember>;

export const memberRef = (familyId: string, userId: string): DocumentReference<FamilyMember> =>
  doc(db, 'families', familyId, 'members', userId) as DocumentReference<FamilyMember>;

export const categoriesCol = (familyId: string): CollectionReference<Category> =>
  collection(db, 'families', familyId, 'categories') as CollectionReference<Category>;

export const categoryRef = (familyId: string, categoryId: string): DocumentReference<Category> =>
  doc(db, 'families', familyId, 'categories', categoryId) as DocumentReference<Category>;

export const fixedExpensesCol = (familyId: string): CollectionReference<FixedExpense> =>
  collection(db, 'families', familyId, 'fixedExpenses') as CollectionReference<FixedExpense>;

export const transactionsCol = (familyId: string): CollectionReference<Transaction> =>
  collection(db, 'families', familyId, 'transactions') as CollectionReference<Transaction>;

export const monthlyReportsCol = (familyId: string): CollectionReference<MonthlyReport> =>
  collection(db, 'families', familyId, 'monthlyReports') as CollectionReference<MonthlyReport>;

export const monthlyReportRef = (familyId: string, month: string): DocumentReference<MonthlyReport> =>
  doc(db, 'families', familyId, 'monthlyReports', month) as DocumentReference<MonthlyReport>;
