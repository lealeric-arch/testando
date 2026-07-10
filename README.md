# Entre Colunas Leilões

Programa **desktop (Electron)** para controle de leilões: cadastro de lotes/catálogo,
arrematantes/clientes, registro de lances e apuração financeira com comissões.

Funciona 100% offline — todos os dados ficam salvos localmente no computador, sem
depender de internet ou servidor.

## Recursos

- **Leilões** — cadastro de eventos com data, local, status e percentuais de comissão
  (comprador e vendedor).
- **Lotes / Catálogo** — número, título, descrição, lance inicial, incremento, avaliação,
  vendedor/consignante, status (aberto / vendido / não vendido) e valor de arremate.
- **Arrematantes / Clientes** — compradores e vendedores com documento (CPF/CNPJ),
  contato e endereço.
- **Lances** — registro de lances por lote/arrematante e apuração do vencedor com um clique
  (transforma o lance em arremate e marca o lote como vendido).
- **Financeiro** — total em martelo, comissões de comprador e vendedor, receita do leiloeiro,
  contas a receber por arrematante, repasse a vendedores e **exportação em CSV**.
- **Backup** — exportar/importar toda a base em um arquivo JSON.

## Como executar

Pré-requisito: [Node.js](https://nodejs.org) 18+ instalado.

```bash
npm install      # instala o Electron
npm start        # abre o aplicativo
```

### Rodar os testes da lógica financeira

```bash
npm test
```

### Gerar instalador (opcional)

```bash
npm run dist     # gera instalador para o sistema atual (Windows/macOS/Linux)
```

## Onde os dados ficam salvos

Os dados são gravados em um arquivo JSON dentro da pasta de dados do usuário do Electron
(`app.getPath('userData')`), por exemplo:

- **Windows:** `%APPDATA%\entre-colunas-leiloes\entre-colunas-data.json`
- **macOS:** `~/Library/Application Support/entre-colunas-leiloes/`
- **Linux:** `~/.config/entre-colunas-leiloes/`

Use **Exportar backup** com frequência para guardar uma cópia em local seguro.

## Modelo de comissões

Para cada lote vendido:

| Valor | Cálculo |
|-------|---------|
| Comissão do comprador | martelo × % comprador |
| Total do comprador | martelo + comissão do comprador |
| Comissão do vendedor | martelo × % vendedor |
| Repasse ao vendedor | martelo − comissão do vendedor |
| Receita do leiloeiro | comissão do comprador + comissão do vendedor |

## Estrutura

```
src/
  main.js            processo principal do Electron (janela + IPC + arquivos)
  preload.js         ponte segura entre renderer e main
  db.js              persistência em arquivo JSON (gravação atômica)
  calc.js            lógica financeira (pura, testável)
  renderer/
    index.html       layout
    styles.css       tema visual
    renderer.js      interface e regras de negócio (SPA)
test/
  calc.test.js       testes da lógica financeira
```
