# 🏎️ ENDURO 2026 — Racer estilo Nintendo 64

Um remake com estética **Nintendo 64** do clássico *Enduro*, feito em um único
arquivo HTML5 + Canvas, sem dependências e sem etapa de build. É só abrir e jogar.

![Enduro 2026](https://img.shields.io/badge/estilo-N64-8a4ae0) ![sem deps](https://img.shields.io/badge/dependências-nenhuma-7fffb0)

## Como jogar

Abra o arquivo [`index.html`](./index.html) em qualquer navegador moderno
(desktop ou celular). Nada para instalar.

## Instalar no PC (Windows) como aplicativo — PWA

O jogo é um **PWA**: dá para instalar como um app com ícone na área de trabalho,
que abre em janela própria e funciona **offline**.

1. Depois que este PR for **mesclado** no `main`, o GitHub Pages publica o jogo
   automaticamente em:
   **`https://lealeric-arch.github.io/testando/enduro-2026/`**
2. Abra esse endereço no **Microsoft Edge** ou **Google Chrome**.
3. Clique no ícone de **instalar** que aparece na barra de endereço
   (ou menu **⋯ → Aplicativos → Instalar este site como um aplicativo**).
4. Pronto: o **Enduro 2026** vira um app com atalho no Menu Iniciar / área de
   trabalho. Depois de aberto uma vez, joga sem internet.

> Também dá para instalar em celular (Android/iOS): abra a URL no navegador e
> use **Adicionar à tela inicial**.

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
| **Nitro**   | `Shift`           | botão **N²O** (azul)   |
| Som on/off  | `M`               | —                      |
| Começar     | `Enter` / `Espaço`| tocar na tela          |
| Pausar      | `P`               | —                      |

### Nitro / turbo
Você começa cada dia com um pouco de **nitro** e recarrega a cada carro
ultrapassado. Segure `Shift` (ou o botão **N²O**) para disparar o boost:
ultrapassa a velocidade máxima normal, abre o campo de visão, solta chamas no
escapamento e enche a tela de *speed lines*. Ultrapassagens em sequência somam
um **COMBO**.

## Características

- **Pista pseudo-3D** com curvas, subidas e descidas geradas proceduralmente
  (cada dia tem um traçado diferente).
- **Cenário completo à beira da pista**: árvores, postes de luz (que acendem à
  noite), outdoors, prédios com janelas iluminadas e nuvens no céu — com fog de
  distância e oclusão por relevo.
- **Nível Need for Speed**: nitro/boost com alargamento de FOV, chamas no
  escapamento, *speed lines*, tremor de câmera em alta velocidade, faíscas nas
  batidas e **combo** de ultrapassagens.
- **Som sintetizado** (WebAudio, sem arquivos): motor com RPM ligado à
  velocidade, sopro do nitro, apito de ultrapassagem e estrondo de batida.
- **HUD estilo NFS**: velocímetro circular com agulha, marcha, barra de nitro e
  contador de combo.
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
- 100% *client-side*, funciona offline.
- **PWA instalável**: `manifest.webmanifest` + `sw.js` (service worker com cache
  offline) + ícones `icon-192.png` / `icon-512.png`.

## Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | O jogo inteiro (canvas + lógica + estilo) |
| `manifest.webmanifest` | Metadados do PWA (nome, ícones, cores) |
| `sw.js` | Service worker — cache offline |
| `icon-192.png` / `icon-512.png` | Ícones do app |
