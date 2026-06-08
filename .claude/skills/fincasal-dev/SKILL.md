---
name: fincasal-dev
description: Use ao construir, manter ou evoluir o FinCasal — app de finanças pessoais para casais (React Native/Expo + TypeScript + Firebase + Anthropic API). Cobre modelo de dados multi-tenant, lançamento de gastos fixos e avulsos, relatórios mensais, análises por IA e regras de segurança. Acione quando o usuário mencionar finanças do casal, gastos fixos, relatório financeiro, ou desenvolvimento do FinCasal.
---

# FinCasal — Skill de Desenvolvimento

## Princípios inegociáveis (verifique em TODA entrega)

1. **Dinheiro em centavos (int).** `1999` = R$ 19,99. Nunca float para valores. Formate só na UI.
2. **Multi-tenant.** Toda coleção fica sob `/families/{familyId}/`. Toda query filtra por `familyId`.
3. **TypeScript estrito.** `strict: true`, zero `any`. Tipe entradas/saídas de cada função.
4. **UTC no banco, fuso na tela.** Salve `Timestamp`/ISO UTC; exiba em `America/Sao_Paulo`.
5. **Chave de IA só no backend.** App → Cloud Function → Anthropic API. Nunca expor chave no cliente.
6. **Offline-first.** Lançamento deve funcionar sem rede (Firestore persistence) e sincronizar.
## Firestore — índices (criar proativamente, nunca reativo)

- Toda query com filtro+ordenação ou múltiplos filtros exige índice composto.
- Declarar TODOS os índices em firestore.indexes.json desde o início e publicar
  com `firebase deploy --only firestore:indexes`. Nunca descobrir um por um.
- Se aparecer "failed-precondition: query requires an index", o erro traz um link
  direto — abrir o link e clicar "Criar índice" resolve em 1-3 min. É etapa normal
  do Firestore, não bug.
## Modelo de dados (referência)

```
families/{familyId}
  ├─ name, currency, timezone, ownerId, members[], plan ('free'|'premium'), createdAt
  ├─ members/{userId}        → role, displayName, color, joinedAt
  ├─ categories/{categoryId} → name, type ('expense'|'income'), icon, color, budgetCents?
  ├─ fixedExpenses/{id}      → label, amountCents, dueDay (1-31), categoryId,
  │                            responsibleUserId, active, startDate, endDate?
  ├─ transactions/{id}       → amountCents, type, categoryId, accountId?, authorId,
  │                            date (UTC), note?, source ('fixed'|'manual'), fixedExpenseId?
  └─ monthlyReports/{YYYY-MM}→ cache do relatório (gerado por Function, não escrito pelo app)
```

Índices Firestore necessários: `transactions` por `(date)`, por `(categoryId, date)`, por `(authorId, date)`.

## Regras de negócio críticas

- **Recorrência:** uma Cloud Function agendada (1º dia do mês) materializa `fixedExpenses` ativos em `transactions` com `source='fixed'`. Não duplicar se já gerado (idempotência via `fixedExpenseId + mês`).
- **Relatório mensal:** total por categoria, fixo vs variável, por autor, comparativo mês anterior, projeção (gasto-até-hoje ÷ dias-decorridos × dias-do-mês).
- **Validação:** valor > 0, categoria existe na família, data não absurda (não > +1 dia no futuro para manual).

## Análise por IA (Claude)

- Rode no backend. Envie um **resumo agregado** (totais por categoria, deltas mês a mês), **nunca a lista bruta de transações** — economiza tokens e protege dados.
- Peça resposta em **JSON estruturado** (insights[], alertas[], sugestoesDeCorte[], scoreSaude 0-100), parseie e renderize em UI nativa. Não jogue texto cru na tela.
- Tom: prático, português BR, específico com números. Ex.: "Delivery subiu 32% (R$ 480 → R$ 634). Cortar 2 pedidos/semana economiza ~R$ 240/mês."
- Faça a IA citar os dados que usou; nunca invente números.

## Roadmap

- **MVP (uso pessoal):** auth, criar família, categorias, lançamento manual rápido, gastos fixos, lista do mês, relatório simples.
- **V1:** análise IA, gráficos, metas/orçamento por categoria, notificações de vencimento, dark mode polido.
- **V1 vendável (SaaS):** onboarding, paywall free/premium (limite de famílias/IA), tela de planos, política de privacidade/LGPD, App Store/Play assets.

## Qualidade de UI ("esplêndido")

- Design tokens (cores, espaçamento, raio) centralizados. Dark mode nativo.
- Tela de lançamento: teclado numérico abre direto, categoria por chips, salvar em 1 toque.
- Estados: loading (skeleton), vazio (ilustração + CTA), erro (retry). Sempre os três.
- Acessibilidade: toque ≥ 44px, contraste AA, `accessibilityLabel` nos botões.

## Ao trabalhar

- Entregue **fatias verticais** (dado → regra → tela → teste), não o app inteiro de uma vez.
- Caminho do arquivo no topo de cada bloco de código.
- Marque com `// 💰 PAYWALL` onde futuramente entra premium, sem implementar agora.
- Termine cada etapa com: o que foi feito, como testar, próximo passo.
