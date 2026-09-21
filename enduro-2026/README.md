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
- **Carros realistas (sprite renderizado)**: um render 3D fotorrealista da
  traseira de um esportivo é usado como sprite, escalado por distância e
  **recolorido por matiz** para os 8 tons da garagem e para os rivais; a polícia
  usa a mesma base em tom claro com giroflex. Fallback vetorial enquanto a
  imagem decodifica.
- **Som sintetizado** (WebAudio, sem arquivos): motor com RPM, sopro do nitro,
  sirene da polícia, apito de ultrapassagem e estrondo de batida.
- **Cidade noturna estilo Underground**: corredor de arranha-céus dos dois lados
  com janelas iluminadas coloridas, luzes de topo piscando, **letreiros neon** com
  halo e reflexo no asfalto molhado, postes acesos e fog de distância.
- **Renderização em alta resolução (supersampling / alta-DPI)**: o mundo é
  desenhado num backbuffer muito maior que a resolução lógica e escalado para a
  tela, ficando nítido em monitores grandes/4K (limitado pela resolução do
  próprio monitor).
- **Ciclo de dia e clima**: *amanhecer, dia, entardecer, noite, chuva, neblina e
  neve*, cada fase com paleta própria.
- **Recorde** salvo localmente (melhor dia + pontuação).
- Controles de **toque** automáticos no celular.

## Versão 3D — ENDURO 2026 · CARNAGE ([`index3d.html`](./index3d.html))

3D real em WebGL (Three.js embutido, roda offline). Abra o arquivo e toque/clique
em **ACELERAR** para começar.

- **Pista infinita e contínua**: traçado procedural que nunca fecha o loop — a
  estrada, as calçadas, os prédios, o trânsito e os pedestres são gerados e
  reciclados à frente do jogador o tempo todo.
- **7 dias de corrida, 3 minutos cada**: a cada dia o ambiente muda —
  *noite, amanhecer, dia, entardecer, chuva, neblina e neve* — com céu, névoa,
  luzes e clima próprios. Ao fim do 7º dia entra a tela de fim com pontuação e
  **recorde** salvo localmente.
- **Pegada Carmageddon (humor negro estilizado)**: **atropele pedestres**
  (+50, com respingo de sangue em partículas vermelhas) e **destrua carros**
  (+120) para somar pontos, encadeando **combos**.
- **Nitro no caminho**: pegue os cristais azuis para recarregar o turbo
  (`Shift` / botão N₂O).
- **Câmera de perseguição** com o carro posicionado bem embaixo na tela,
  sombras em tempo real no desktop, faróis, letreiros neon e **minimapa** com o
  traçado à frente.
- **Trilha synthwave** sintetizada (WebAudio, sem arquivos) e SFX de atropelo,
  batida e nitro. `M` liga/desliga o som.

Controles: `↑` acelera · `↓` freia · `← →` dirige · `Shift` nitro · `M` música ·
`Enter` começa. No celular, botões na tela.

## Detalhes técnicos

- Resolução interna `384×240` escalada com suavização, renderizador de estrada por
  segmentos projetados (técnica estilo *Out Run* / Enduro), tudo no `<canvas>`.
- 100% *client-side*, sem dependências, funciona offline.
- **PWA instalável**: `manifest.webmanifest` + `sw.js` + ícones.

## Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | Versão 2D pseudo-3D (canvas) — completa: garagem, polícia, drift, chuva |
| `index3d.html` | **Versão 3D real (WebGL/Three.js)** — pista **infinita**, **7 dias** (3 min cada) com ambiente diferente por dia, pegada **Carmageddon** (atropele pedestres e destrua carros por pontos, com respingo de sangue), nitro no caminho, minimapa e trilha synthwave. Roda no PC e no celular. Three.js embutido (offline) |
| `manifest.webmanifest` | Metadados do PWA |
| `sw.js` | Service worker — cache offline |
| `icon-192.png` / `icon-512.png` | Ícones do app |
