# 🏎️ ENDURO 2026 — Racer 16-bit

Um remake com estética **16-bit** do clássico *Enduro*, feito em um único arquivo
HTML5 + Canvas, sem dependências e sem etapa de build. É só abrir e jogar.

![Enduro 2026](https://img.shields.io/badge/estilo-16--bit-ff5a4a) ![sem deps](https://img.shields.io/badge/dependências-nenhuma-7fffb0)

## Como jogar

Abra o arquivo [`index.html`](./index.html) em qualquer navegador moderno
(desktop ou celular). Nada para instalar.

### Objetivo
Como no Enduro original, cada **dia** tem uma **cota de carros** que você precisa
ultrapassar. Cumpra a cota para avançar ao próximo dia — e a cota cresce a cada dia.
O placar (`SCORE`) soma todos os carros ultrapassados na carreira.

### Controles

| Ação        | Teclado           | Toque (celular)        |
|-------------|-------------------|------------------------|
| Acelerar    | `↑` / `W`         | botão ▲ (verde)        |
| Frear       | `↓` / `S`         | botão ■ (vermelho)     |
| Virar       | `←` `→` / `A` `D` | botões ◀ ▶             |
| Começar     | `Enter` / `Espaço`| tocar na tela          |
| Pausar      | `P`               | —                      |

## Características

- **Pista pseudo-3D** com curvas, subidas e descidas geradas proceduralmente
  (cada dia tem um traçado diferente).
- **Ciclo de dia e clima** que passa por *amanhecer, dia, entardecer, noite,
  neblina e neve* — cada fase com paleta 16-bit própria, sol/lua, estrelas,
  faróis à noite, neblina e flocos de neve.
- **Carros rivais** para ultrapassar, com colisões que reduzem sua velocidade.
- **HUD retrô** com contador de carros restantes, velocímetro e efeito de
  scanlines CRT.
- **Recorde** salvo localmente (melhor dia + carros ultrapassados).
- Controles de **toque** automáticos em dispositivos móveis.

## Detalhes técnicos

- Resolução interna fixa de `320×200` escalada com *pixel art* nítido
  (`image-rendering: pixelated`) — o visual 16-bit.
- Renderizador de estrada baseado em segmentos projetados (técnica estilo
  *Out Run* / Enduro), tudo desenhado no `<canvas>`.
- 100% *client-side*, arquivo único, funciona offline.
