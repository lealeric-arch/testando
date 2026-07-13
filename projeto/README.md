# 📋 Projeto — Entre Colunas Leilões

> Gestão e planejamento de leilões de imóveis arrematados (foco no ecossistema da
> Caixa Econômica Federal). App **desktop** (Windows/macOS/Linux) e **web/PWA** para
> celular, com uso individual e dados salvos localmente no aparelho.

- **Repositório:** `lealeric-arch/testando`
- **Branch principal / de deploy:** `claude/pc-auction-control-259bzg`
- **Versão atual:** `1.4.0`
- **App web:** https://lealeric-arch.github.io/testando/
- **Downloads (release):** https://github.com/lealeric-arch/testando/releases/latest

---

## 1. Visão geral

O sistema gerencia o ciclo completo do ativo — arrematação → desocupação → reformas →
despesas (ITBI/cartório) → venda — com simulações financeiras detalhadas para
investidores individuais e sociedades de **até 5 sócios**. Modelo financeiro espelhado
na planilha real "Controle de Leilões".

Uso **individual e offline**: os dados ficam apenas no aparelho (arquivo local no
desktop; `localStorage` na web). Sem nuvem, sem login, sem compartilhamento.

## 2. Como usar

| Plataforma | Como |
|---|---|
| 💻 **Windows** | Baixar e instalar `EntreColunasLeiloes-Setup-<versão>.exe` do [release](https://github.com/lealeric-arch/testando/releases/latest). |
| 🍎 **macOS (Apple Silicon)** | Baixar o `.dmg` do release. |
| 🐧 **Linux** | Baixar o `.AppImage` do release. |
| 📱 **Celular** | Abrir https://lealeric-arch.github.io/testando/ no navegador → "Adicionar à tela inicial" (funciona offline). |

> Dados do celular e do PC são independentes. Use **Ajustes → Backup** para exportar
> um `.json` e importar no outro aparelho.

## 3. Arquitetura e stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS.
- **Animações:** `motion` (`motion/react`).
- **Desktop:** Electron (empacotado com electron-builder).
- **Web:** PWA (manifest + service worker, cache offline) publicada no GitHub Pages.
- **Persistência:**
  - Desktop → arquivo JSON via IPC (`entre-colunas-dados.json` na pasta do usuário, gravação atômica).
  - Web → `localStorage`.
- **Identidade visual Caixa:** azul `#005CA9`, laranja `#F37021`; fontes Inter / Space Grotesk / JetBrains Mono.

### Estrutura de pastas

```
electron/        Processo principal + preload (janela, IPC, persistência, diálogos)
src/
  types.ts       Modelo de dados (Imovel, Gasto, Socio, Viabilidade…)
  App.tsx        Estado global, roteamento por abas, toaster, rodapé
  utils/
    finance.ts        Resultado do imóvel, portfólio, viabilidade, partilha, comissão
    gcap.ts           Calculadora de Ganho de Capital (Lei do Bem + Lei 13.259/2016)
    alerts.ts         Alertas operacionais críticos
    notifications.ts  Notification API + dedupe
    storage.ts        Persistência híbrida (arquivo no desktop / localStorage na web)
    excelExport.ts / portfolioExport.ts   Exportação .xls
    images.ts / download.ts / toast.ts / seed.ts
  components/
    Dashboard, PropertyList, PropertyForm, PropertyDetail,
    GastosTab, ResultadoTab, SociosTab, GcapTab,
    CalculadoraViabilidade, ExportModal, ReportView,
    AjustesView, NotificationSettings, Toaster, ui.tsx
test/            Testes (vitest) da lógica financeira e de GCAP
.github/workflows/
    build-desktop.yml  Testes → instaladores → publica no Release
    pages.yml          Testes → build web → deploy no GitHub Pages
```

## 4. Funcionalidades

### Dashboard
- KPIs: capital investido, lucro realizado (após IR), ROI médio, carteira em estoque.
- **Painel de alertas críticos**: estoque prolongado (> 30 dias) e Liminar/Mandado.
- **Retorno por sócio (carteira)**: soma dos imóveis vendidos por participante.

### Portfólio
- CRUD de imóveis com foto (por hash/estável), badges de status, busca com contador filtrado.
- Exclusão em cascata (com confirmação inline) — remove gastos vinculados.
- Botão de exportação (Excel).

### Detalhe do imóvel (abas)
- **Gastos** — lançamento por fase (aquisição × venda), categoria, "pago por" (Você/sócio), edição inline.
- **Resultado** — total investido → venda → saldo líquido → IR → lucro líquido → ROI → divisão entre sócios (modelo da planilha).
- **Sociedade** — até 5 sócios, com participação no imóvel × no lucro e papel.
- **Desocupação** — timeline de etapas judiciais, com notificação a cada avanço.
- **Calculadora GCAP** — dedução de despesas, fatores da Lei do Bem, isenção por reinvestimento e alíquotas progressivas da Lei 13.259/2016.
- Ações: exportar Excel, abrir relatório imprimível ("Prestação de Contas").

### Viabilidade Pré-Lance
- Lance máximo para garantir a margem desejada; custo total e ROI (à vista e alavancado).
- Simulação de financiamento Caixa (entrada, financiado, capital necessário).
- Checklist de due diligence (Pendente → OK → Risco) e recomendação automática.
- "Criar imóvel a partir da simulação".

### Ajustes
- **Backup**: exportar/importar `.json` (modos mesclar ou substituir).
- **Notificações**: permissão nativa, teste e limpar histórico.

### Financeiro
- Comissão do corretor (padrão 5%) deduzida antes do IR.
- IR sobre o lucro (premissa configurável, padrão 15%).
- Exportação Excel por imóvel e consolidada do portfólio (com filtros de escopo/status/sócio/período).

## 5. Qualidade e CI/CD

- **Testes automatizados** (vitest): 14 testes da lógica financeira e de GCAP.
- **CI (GitHub Actions):**
  - `build-desktop.yml`: roda os testes → gera os instaladores → publica no Release.
  - `pages.yml`: roda os testes → build web → deploy no GitHub Pages (a cada push).
- Os testes **bloqueiam** o release e o deploy se algum cálculo quebrar.

## 6. Histórico de versões

| Versão | Destaque |
|---|---|
| 1.0.0 | App web da Caixa (React): dashboard, alertas, notificações, GCAP, CRUD, edição inline. |
| 1.1.0 | Funções do app AI Studio: Viabilidade, Exportação Excel, Relatório, partilha de sócios, comissão do corretor, fotos, aba Resultado (modelo da planilha). Empacotamento desktop (Electron) + release. |
| 1.2.0 | Backup/restauração (.json) e responsividade mobile + PWA (uso no celular). |
| 1.3.0 | Correções do QA: persistência em arquivo (desktop), tela em branco, validações, toasts, favicon. |
| 1.4.0 | Testes automatizados + CI com gate de qualidade; retorno consolidado por sócio no Dashboard. |

## 7. Bugs corrigidos (relatório de QA — 13/07/2026)

| # | Severidade | Problema | Status |
|---|---|---|---|
| 1 | 🔴 | Perda de dados ao focar/reabrir (seed repovoava demos) | ✅ persistência real em arquivo (IPC) |
| 2 | 🔴 | Área de conteúdo em branco | ✅ render direto + fallback de detalhe |
| 3 | 🔴 | Valores monetários negativos aceitos | ✅ `min=0` + validação |
| 4 | 🟡 | Viabilidade inviável mostrava lucro/ROI | ✅ mostra "—" |
| 5 | 🟡 | Sucesso falso ao cancelar exportação | ✅ diálogo nativo com retorno real |
| 6 | 🟡 | Contador não refletia a busca | ✅ "X de Y" |
| 7 | 🟡 | Datas ilógicas (venda < arrematação) | ✅ validação |
| 8/10 | 🟢 | `alert()` nativo / foco perdido | ✅ toasts na interface |
| 9 | 🟢 | Favicon `/C:/favicon.svg` no console | ✅ caminho relativo |

## 8. Modelo de dados (resumo)

- **Imóvel** — título, código Caixa, matrícula, modalidade, endereço, comprador, status
  (6 fases), etapa de desocupação, valores (arrematação/avaliação/venda), IR e comissão
  do corretor, sócios.
- **Gasto** — categoria (por fase aquisição/venda), valor, data, "pago por", dedutível GCAP.
- **Sócio** — participação no imóvel × no lucro, papel, aporte.

## 9. Desenvolvimento

```bash
npm install
npm run dev            # web em http://localhost:5173
npm run electron:dev   # abre na janela do Electron
npm test               # roda os testes (vitest)
npm run build          # typecheck + build
npm run dist:win       # gera o instalador local (Windows)
```

O deploy web e o release são automáticos a cada push na branch principal.

## 10. Roadmap (próximos passos sugeridos)

- [ ] Gráficos no Dashboard (evolução de lucro/ROI, distribuição por status).
- [ ] Modo escuro.
- [ ] Filtros avançados no portfólio (status, cidade, faixa de valor).
- [ ] Relatório consolidado do portfólio em PDF.
- [ ] Campos/relatórios específicos do fluxo de trabalho do usuário.
- [ ] (Opcional) Sincronização entre aparelhos (reativar Firebase) — hoje é local por escolha.

---

_Documento gerado como consolidação do projeto. A calculadora GCAP e as simulações são
estimativas de planejamento, sem valor fiscal — confirme com a legislação vigente e um
contador. A Entre Colunas Leilões atua de forma independente, sem vínculo com a Caixa
Econômica Federal._
