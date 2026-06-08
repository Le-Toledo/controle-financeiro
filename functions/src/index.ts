import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();

// ── Fase 2: Cloud Functions reais ──────────────────────────────────────────
//
// TODO generateMonthlyTransactions
//   Scheduled function (1º dia de cada mês) — percorre todas as famílias,
//   pega fixedExpenses ativos, materializa transactions com source='fixed'.
//   Idempotência: verifica se já existe uma transaction com
//   (fixedExpenseId, mês) antes de criar.
//
// TODO generateMonthlyReport
//   Triggered no onWrite de transactions — recalcula o monthlyReports/{YYYY-MM}
//   da família.
//
// TODO analyzeFinancesWithAI
//   HTTPS callable — recebe familyId + month, agrega dados do relatório,
//   chama Anthropic API com resumo (nunca transações brutas), retorna
//   JSON estruturado: { insights[], alertas[], sugestoesDeCorte[], scoreSaude }.
//   💰 PAYWALL: limitar a 3 chamadas/mês no plano free.
//
// TODO sendDueDateNotification
//   Scheduled diária — 3 dias antes do dueDay de cada fixedExpense, envia
//   push via FCM para o responsibleUserId.

export { };
