# FinCasal — Planejamento Sênior (Produto + Técnico + Go-to-Market)

App de finanças pessoais para casais. Construído para uso próprio, arquitetado para virar SaaS vendável.

---

## 1. Visão e por que isso vende

A dor "casal não sabe pra onde foi o dinheiro" é universal e recorrente — é a melhor combinação para SaaS (problema diário + disposição a pagar). A maioria dos apps grandes (Mobills, Organizze) é genérica e individual. **Diferencial do FinCasal: feito para 2 pessoas no mesmo orçamento + IA que dá conselho prático, não só gráfico.** Isso é nicho defensável.

Por isso a decisão técnica nº 1: **multi-tenant ("família") desde o dia 1.** Modelar como usuário único e depois adaptar para SaaS é reescrever o app. Modelar como família desde já custa quase o mesmo e abre o caminho de venda. Exemplo real: o Notion começou multiplayer; o Bear começou single-user e até hoje sofre pra virar colaborativo.

---

## 2. Arquitetura

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  App (Expo/RN/TS)   │────▶│  Firebase            │     │  Anthropic API  │
│  - Offline-first    │     │  - Auth              │     │  (Claude)       │
│  - Lançamento <5s   │◀────│  - Firestore         │     └────────▲────────┘
│  - Gráficos/IA UI   │     │  - Cloud Functions ──┼─────────────┘
└─────────────────────┘     │  - FCM (notif.)      │  (chave fica AQUI, nunca no app)
                            └──────────────────────┘
```

**Por que Firebase e não backend próprio agora:** você está sozinho construindo. Firebase te dá auth, banco em tempo real, offline e push sem servidor para manter. Isso é semanas economizadas. Quando o SaaS crescer e o custo do Firestore pesar, migra-se a camada de leitura pesada para Postgres — mas só então. Otimização prematura mata projeto solo.

**Por que Cloud Functions para a IA:** se a chave da Anthropic for pro app, qualquer um a extrai do binário e gasta seu crédito. A Function também agrega os dados (manda resumo, não 800 transações) — corta custo de token em ~90%.

---

## 3. Stack e ferramentas (o "kit nível master")

| Camada | Escolha | Por quê |
|---|---|---|
| App | Expo (RN) + TypeScript | Seu stack; build OTA com EAS Update (você já usa) |
| Navegação | Expo Router | File-based, menos boilerplate |
| Estado servidor | TanStack Query + Firestore listeners | Cache, sync, offline |
| Estado local | Zustand | Leve, sem boilerplate do Redux |
| Formulários | React Hook Form + Zod | Validação tipada, mesma lib no back |
| UI | Tamagale/NativeWind + tokens próprios | Dark mode, consistência |
| Gráficos | Victory Native ou react-native-gifted-charts | Donut por categoria, barras mês a mês |
| Backend | Firebase Functions (TS) | Recorrência, relatório, IA |
| IA | Anthropic API (Claude) | Insights em JSON estruturado |
| Validação compartilhada | Zod (pacote `shared`) | Mesmo schema no app e na Function |
| Testes | Vitest (lógica) + Firestore Emulator (regras) | Cobrir cálculo e segurança |
| CI/CD | GitHub Actions + EAS (você já domina) | Build/test automatizado |
| Erros | Sentry | Monitorar crash em produção |

**Skills do Claude que aceleram cada parte:**
- `frontend-design` → telas com qualidade visual real, sem cara de IA genérica.
- `mcp-builder` → se quiser depois conectar a IA a dados externos (Open Finance, extrato bancário).
- `skill-creator` → para evoluir a própria `fincasal-dev` conforme o app cresce.
- `docx`/`pdf` → gerar relatório mensal exportável em PDF (feature premium ótima de vender).

---

## 4. Modelo de dados (Firestore)

```
families/{familyId}
  name, currency='BRL', timezone='America/Sao_Paulo', ownerId,
  members: [userId], plan: 'free'|'premium', createdAt

  members/{userId}     role:'owner'|'member', displayName, color, joinedAt
  categories/{id}      name, type:'expense'|'income', icon, color, budgetCents?
  fixedExpenses/{id}   label, amountCents, dueDay(1-31), categoryId,
                       responsibleUserId, active:bool, startDate, endDate?
  transactions/{id}    amountCents, type, categoryId, authorId, date(UTC),
                       note?, source:'fixed'|'manual', fixedExpenseId?
  monthlyReports/{YYYY-MM}  (cache gerado por Function — app só lê)
```

**Decisões e exemplos:**
- **Centavos inteiros:** R$ 19,99 vira `1999`. Por quê: `0.1 + 0.2 !== 0.3` em float; com dinheiro isso vira erro de centavos que aparece no relatório e destrói confiança. Bancos fazem assim.
- **`monthlyReports` em cache:** relatório de 1 mês pode somar centenas de transações. Recalcular a cada abertura do app é lento e caro (cada leitura Firestore custa). A Function calcula uma vez e o app lê 1 documento.
- **`source` + `fixedExpenseId`:** distingue gasto fixo (gerado) de avulso, e garante idempotência (não duplicar o aluguel do mês).

---

## 5. Regras de segurança (esqueleto)

```javascript
match /families/{familyId}/{document=**} {
  allow read, write: if request.auth != null
    && request.auth.uid in get(/databases/$(database)/documents/families/$(familyId)).data.members;
}
```
Princípio: só quem está em `members` da família acessa. Testar com Firestore Emulator — regra errada é o vazamento de dados nº 1 em apps Firebase.

---

## 6. Roadmap em fases

**Fase 0 — Fundação (1 sem)**
Projeto Expo + TS estrito, Firebase, pacote `shared` com tipos/Zod, design tokens, auth, criar/entrar em família.

**Fase 1 — MVP de uso real (2 sem)**
Categorias seed, lançamento manual rápido (<5s), gastos fixos, lista do mês, relatório simples (total + por categoria). *Aqui você e sua esposa já usam de verdade — o melhor teste.*

**Fase 2 — V1 (2-3 sem)**
Function de recorrência, relatório completo (fixo vs variável, por autor, comparativo), gráficos, análise IA, notificações de vencimento, dark mode polido.

**Fase 3 — Vendável (2-3 sem)**
Onboarding, paywall free/premium, tela de planos, LGPD/privacidade, export PDF (premium), assets de loja, Sentry.

Limites sugeridos do plano: **Free** = 1 família, IA 3x/mês. **Premium** = ilimitado + export PDF + projeções. // 💰

---

## 7. Como monetizar (real)

- **Assinatura B2C:** R$ 12,90–19,90/mês ou R$ 99/ano. Casais pagam por organização financeira — o ROI percebido (economia que a IA aponta) paga a assinatura.
- **Modelo freemium:** o app grátis vicia no hábito de lançar; a IA e o PDF são o gatilho de upgrade.
- **Validação antes de escalar:** lance a landing page (você já faz isso no GitHub Pages + Kiwify) com lista de espera antes de gastar meses. Se ninguém entra na lista, ajuste a proposta.
- **Distribuição:** seu próprio público de concurseiro/dev já é early adopter. Conteúdo no Instagram (você já tem estratégia) mostrando "a IA me disse onde eu estava perdendo R$ 300/mês" converte muito.

---

## 8. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Custo de token da IA | Enviar só resumo agregado; cache de relatório; limitar no free |
| Custo Firestore ao escalar | Cache em `monthlyReports`; paginar transações |
| LGPD (dado financeiro é sensível) | Criptografia em trânsito (padrão), regras estritas, política clara, opção de excluir conta/dados |
| App Store rejeitar | Seguir guidelines de assinatura; tela de planos transparente |
| Você desistir no meio (projeto solo) | Fase 1 já é usável — entregue valor cedo, não persiga perfeição |

---

## 9. Próximo passo concreto

1. Cole `PROMPT_MESTRE.md` no Claude Code.
2. Coloque `SKILL.md` em `.claude/skills/fincasal-dev/` do projeto.
3. Peça: *"Gere a Fase 0 — fatia vertical: setup do projeto + modelo de dados + regras + tela de login."*
4. Use de verdade na Fase 1 antes de investir na IA. Dado real do seu próprio uso é o que vai fazer o produto bom o suficiente pra vender.
