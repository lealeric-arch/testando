# 🏎️ ENDURO 2026 — Racer estilo Nintendo 64

Um remake com estética **Nintendo 64** do clássico *Enduro*, feito em um único
arquivo HTML5 + Canvas, sem dependências e sem etapa de build. É só abrir e jogar.

![Enduro 2026](https://img.shields.io/badge/estilo-N64-8a4ae0) ![sem deps](https://img.shields.io/badge/dependências-nenhuma-7fffb0)

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
- **Visual estilo N64**: renderização suavizada (filtragem bilinear), carros com
  **sombreamento gouraud** (gradientes) e o característico **fog de distância** —
  a pista nasce da bruma no horizonte.
- **Ciclo de dia e clima** que passa por *amanhecer, dia, entardecer, noite,
  neblina e neve* — cada fase com paleta própria, sol/lua, estrelas, faróis à
  noite, neblina e flocos de neve.
- **Carros rivais** para ultrapassar, com colisões que reduzem sua velocidade.
- **HUD estilo Mario Kart 64** com texto contornado grosso, contador de carros
  restantes e velocímetro, dentro de uma moldura de console.
- **Recorde** salvo localmente (melhor dia + carros ultrapassados).
- Controles de **toque** automáticos em dispositivos móveis.

## Detalhes técnicos

- Resolução interna de `384×240` escalada com suavização (`image-rendering: auto`)
  para o aspecto 3D filtrado do N64.
- Renderizador de estrada baseado em segmentos projetados (técnica estilo
  *Out Run* / Enduro), com fog de distância por segmento, tudo no `<canvas>`.
- 100% *client-side*, arquivo único, funciona offline.
