# Entre Colunas Leilões

Aplicação web de **gestão e planejamento de leilões de imóveis arrematados**, focada no
ecossistema da **Caixa Econômica Federal**. Cobre o ciclo completo do ativo — arrematação,
desocupação, reformas, despesas (ITBI/cartório) e venda final — com simulações financeiras
detalhadas para investidores individuais e sociedades.

## ✨ Funcionalidades

### Dashboard e alertas operacionais críticos
- KPIs de carteira: capital investido, lucro realizado, ROI médio e valor em estoque.
- **Estoque prolongado** — alerta quando um imóvel está em "Estoque" há mais de 30 dias.
- **Liminar crítica** — alerta quando a etapa de desocupação é "Liminar / Mandado".

### Notificações push nativas (Web Notification API)
- Autorização de notificações no navegador, com aviso elegante quando rodando em `iframe`.
- Dispara alerta nativo quando o status muda ou uma nova etapa judicial é alcançada.
- Anti-spam: alertas persistentes de estoque/liminar são enviados **uma única vez por ativo**
  (dedupe via `localStorage`).

### Calculadora Progressiva GCAP (Ganho de Capital)
- Ganho bruto com dedução de despesas elegíveis (ITBI, registro, reformas, leiloeiro).
- Fatores de redução da **Lei do Bem** (Lei 11.196/2005) — FR1 e FR2, calculados mês a mês.
- Isenção por **reinvestimento residencial em até 180 dias** (art. 39).
- Alíquotas progressivas da **Lei 13.259/2016** (15% / 17,5% / 20% / 22,5%) com
  visualizador em barras horizontais por faixa.

### Operações do inventário (CRUD)
- Cadastro/edição de imóveis com foto, status, etapa de desocupação e valores.
- **Exclusão em cascata** de imóveis (remove todos os gastos vinculados), com popover de
  confirmação de segurança no grid e na página de detalhes.
- **Edição inline de gastos** — ícone de lápis abre um formulário no próprio card,
  recalculando o resumo financeiro instantaneamente.
- Quadro societário com rateio de resultado por participação.

## 🛠️ Tech stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS.
- **Animações:** `motion` (`motion/react`) para transições de abas, modais e cards.
- **Persistência híbrida:** Firebase/Firestore em tempo real (Auth anônimo) quando
  configurado, com **fallback transparente para `localStorage`** no modo offline.
- **Identidade visual Caixa:** azul `#005CA9` e laranja `#F37021`; fontes `Inter` /
  `Space Grotesk` e `JetBrains Mono` para dados técnicos.

## 🚀 Como executar

Pré-requisito: [Node.js](https://nodejs.org) 18+.

```bash
npm install
npm run dev       # ambiente de desenvolvimento (http://localhost:5173)
npm run build     # typecheck + build de produção
npm run preview   # serve o build de produção
```

A aplicação já vem com **dados de exemplo** no primeiro acesso (modo local).

### Firebase (opcional)

Sem configuração, tudo funciona offline via `localStorage`. Para sincronização em nuvem,
copie `.env.example` para `.env` e preencha as credenciais do seu projeto Firebase
(`VITE_FIREBASE_*`).

## 📁 Estrutura

```
src/
  types.ts                     Interfaces globais (Imovel, Gasto, Socio, ...)
  App.tsx                      Estado global, sincronização e roteamento por abas
  firebase.ts                  Inicialização opcional do Firebase/Firestore
  utils/
    finance.ts                 Receitas, despesas dedutíveis e custos consolidados
    gcap.ts                    Motor da calculadora de Ganho de Capital
    alerts.ts                  Alertas operacionais críticos
    notifications.ts           Notification API + dedupe por localStorage
    storage.ts                 Persistência híbrida Firestore/localStorage
    seed.ts                    Dados de demonstração
  components/
    Dashboard.tsx              KPIs + painel de alertas
    PropertyList.tsx           Grid de imóveis (fotos, badges, exclusão)
    PropertyDetail.tsx         Detalhe do ativo com 4 abas financeiras
    GastosTab.tsx              Gastos com edição inline
    SociosTab.tsx              Quadro societário e rateio
    GcapTab.tsx                Calculadora GCAP com barras de faixas
    NotificationSettings.tsx   Controle de permissões de notificação
    PropertyForm.tsx           Formulário de cadastro/edição de imóvel
    ui.tsx                     Modal, badges e popover de confirmação
```

> ⚠️ A calculadora GCAP é uma ferramenta de planejamento. Confirme sempre com a legislação
> vigente e um contador antes de decisões fiscais.
