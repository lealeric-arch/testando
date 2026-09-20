# 🏎️ ENDURO 2026 — Turbo Racer

Racer pseudo-3D com pegada **Need for Speed**, em um único arquivo HTML5 + Canvas,
sem dependências e sem etapa de build. É só abrir e jogar.

![racer](https://img.shields.io/badge/estilo-Need%20for%20Speed-8a4ae0) ![sem deps](https://img.shields.io/badge/dependências-nenhuma-7fffb0)

## Como jogar

Abra o arquivo [`index.html`](./index.html) em qualquer navegador moderno
(desktop ou celular). Nada para instalar.

### Objetivo
Cada **dia** tem uma **cota de carros** para ultrapassar — cumpra a cota para
avançar ao próximo dia (a cota cresce a cada dia). Mas dirigir na loucura chama a
**polícia**: se o medidor de captura encher, você é preso. Some pontos
ultrapassando carros e mandando **drifts** longos.

### Controles

| Ação        | Teclado           | Toque (celular)        |
|-------------|-------------------|------------------------|
| Acelerar    | `↑` / `W`         | botão ▲ (verde)        |
| Frear       | `↓` / `S`         | botão ■ (vermelho)     |
| Virar / drift | `←` `→` / `A` `D` | botões ◀ ▶           |
| **Nitro**   | `Shift`           | botão **N²O** (azul)   |
| Som on/off  | `M`               | —                      |
| Avançar     | `Enter` / `Espaço`| tocar na tela          |
| Pausar      | `P`               | —                      |

No **menu**, `Enter` abre a **garagem**; nela use `←` `→` para trocar de carro,
`↑` `↓` para trocar a cor, e `Enter` para correr.

## Características (pacote Need for Speed)

- **Seleção de carro (garagem)**: 5 modelos com **stats diferentes** (velocidade,
  aceleração, manobra) e **8 cores** — cada carro muda o jeito de dirigir.
- **Perseguição policial**: dirigir agressivo enche o medidor **PROCURADO**; ao
  encher, viaturas com sirene e giroflex vermelho/azul te caçam. O nível de
  procurado (★ até 5) sobe com o tempo. Abra distância para **despistar** — se o
  medidor de **captura** encher, é *BUSTED*.
- **Drift com pontuação**: derrape nas curvas em alta velocidade para acumular
  pontos de drift, com **fumaça nos pneus** e o carro angulado. Bater zera o drift.
- **Minimapa + posição**: minimapa com o traçado da pista, sua posição e as
  viaturas; HUD mostra a **posição** na pista (POS x/N).
- **Chuva com reflexos**: fase de chuva com asfalto molhado refletindo as luzes
  dos postes, poça de reflexo dos faróis e gotas diagonais.
- **Nitro / turbo**: recarrega a cada ultrapassagem; solta chamas, alarga o FOV e
  enche a tela de *speed lines*. Ultrapassagens seguidas somam **COMBO**.
- **Carros realistas**: traseira com para-choque, spoiler, vidro com reflexo,
  lanternas com brilho, placa, escapamento duplo e pneus — com sombreamento.
- **Som sintetizado** (WebAudio, sem arquivos): motor com RPM, sopro do nitro,
  sirene da polícia, apito de ultrapassagem e estrondo de batida.
- **Cenário à beira da pista**: árvores, postes (que acendem à noite), outdoors,
  prédios com janelas iluminadas e nuvens — com fog de distância e oclusão.
- **Ciclo de dia e clima**: *amanhecer, dia, entardecer, noite, chuva, neblina e
  neve*, cada fase com paleta própria.
- **Recorde** salvo localmente (melhor dia + pontuação).
- Controles de **toque** automáticos no celular.

## Detalhes técnicos

- Resolução interna `384×240` escalada com suavização, renderizador de estrada por
  segmentos projetados (técnica estilo *Out Run* / Enduro), tudo no `<canvas>`.
- 100% *client-side*, sem dependências, funciona offline.
- **PWA instalável**: `manifest.webmanifest` + `sw.js` + ícones.

## Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | O jogo inteiro (canvas + lógica + estilo) |
| `manifest.webmanifest` | Metadados do PWA |
| `sw.js` | Service worker — cache offline |
| `icon-192.png` / `icon-512.png` | Ícones do app |
