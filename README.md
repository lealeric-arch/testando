# Entre Colunas Leilões

Aplicativo **desktop** de **gestão e planejamento de leilões de imóveis arrematados**, focado
no ecossistema da **Caixa Econômica Federal**. Cobre o ciclo completo do ativo — arrematação,
desocupação, reformas, despesas (ITBI/cartório) e venda final — com simulações financeiras
detalhadas para investidores individuais e sociedades de **até 5 sócios**. Uso individual,
com dados salvos localmente no próprio computador.

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

- **Aplicativo desktop:** Electron (instalável no Windows/macOS/Linux).
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS.
- **Animações:** `motion` (`motion/react`) para transições de abas, modais e cards.
- **Persistência local:** usuário único, sem nuvem/compartilhamento. Todos os dados ficam
  no próprio computador (`localStorage`).
- **Identidade visual Caixa:** azul `#005CA9` e laranja `#F37021`; fontes `Inter` /
  `Space Grotesk` e `JetBrains Mono` para dados técnicos.

## 💾 Instalador desktop (executável)

### Opção 1 — Baixar pronto do GitHub Actions (recomendado)

O repositório inclui um workflow que compila os instaladores automaticamente:

1. No GitHub, abra a aba **Actions** → **Build desktop installers**.
2. A cada push nesta branch o build roda sozinho; ou clique em **Run workflow** para
   disparar manualmente.
3. Ao terminar, baixe o artefato na seção **Artifacts** da execução:
   - `instalador-windows` → `EntreColunasLeiloes-Setup-1.0.0.exe`
   - `instalador-macos` → `.dmg`
   - `instalador-linux` → `.AppImage`
4. No Windows, execute o `.exe` e siga o instalador (permite escolher a pasta e cria
   atalho na área de trabalho).

### Opção 2 — Compilar localmente

Pré-requisito: [Node.js](https://nodejs.org) 18+.

```bash
npm install
npm run dist:win     # gera o instalador .exe (na pasta release/)
# npm run dist:mac   # macOS (.dmg) — rode em um Mac
# npm run dist:linux # Linux (.AppImage)
```

O instalador gerado fica na pasta `release/`.

## 🚀 Desenvolvimento

```bash
npm run dev          # app web em http://localhost:5173
npm run electron:dev # abre dentro da janela do Electron
npm run build        # typecheck + build de produção
```

A aplicação já vem com **dados de exemplo** no primeiro acesso.

## 📁 Estrutura

```
electron/
  main.cjs                     Processo principal do Electron (janela desktop)
src/
  types.ts                     Interfaces globais (Imovel, Gasto, Socio, ...)
  App.tsx                      Estado global e roteamento por abas
  utils/
    finance.ts                 Receitas, despesas dedutíveis e custos consolidados
    gcap.ts                    Motor da calculadora de Ganho de Capital
    alerts.ts                  Alertas operacionais críticos
    notifications.ts           Notification API + dedupe por localStorage
    storage.ts                 Persistência local (localStorage, usuário único)
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
