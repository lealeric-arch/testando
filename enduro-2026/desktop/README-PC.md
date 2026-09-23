# ENDURO 2026 · CITY — app de PC (Windows / Mac / Linux)

Duas formas de jogar no PC. A primeira **não instala nada**; a segunda gera um
**instalador `.exe`** de verdade.

---

## 1) Jogar já, sem instalar (mais fácil)

Na pasta `enduro-2026/` há um atalho:

- **Windows:** dê dois cliques em **`JOGAR-PC.bat`** — abre o jogo em tela cheia
  no Chrome/Edge (modo aplicativo, sem barra de navegador).
- **Mac/Linux:** rode **`jogar-pc.sh`** (`bash jogar-pc.sh`).

Também dá para simplesmente abrir `index3d.html` em qualquer navegador, ou, no
Chrome, usar **⋮ → Salvar e compartilhar → Criar atalho… → "Abrir como janela"**
para virar um "app".

---

## 2) Gerar um instalador nativo (.exe / .dmg / .AppImage)

Isso cria um aplicativo de PC de verdade (janela nativa, tela cheia, offline),
usando **Electron**. Você precisa rodar na **sua máquina** (com internet normal),
porque o build baixa os binários do Electron — o ambiente de nuvem onde eu rodo
bloqueia esse download.

Pré-requisitos: [Node.js](https://nodejs.org) 18+ instalado.

```bash
cd enduro-2026/desktop
npm install          # baixa o Electron (~200 MB, só na 1ª vez)
npm start            # testa o jogo na janela nativa
npm run dist         # gera o instalador na pasta desktop/dist/
```

Resultado em `enduro-2026/desktop/dist/`:

| Sistema  | Arquivo gerado                          | Comando alternativo |
|----------|-----------------------------------------|---------------------|
| Windows  | `ENDURO 2026 CITY Setup 1.0.0.exe`      | `npm run dist:win`  |
| macOS    | `ENDURO 2026 CITY-1.0.0.dmg`            | `npm run dist:mac`  |
| Linux    | `ENDURO 2026 CITY-1.0.0.AppImage`       | `npm run dist:linux`|

> Para gerar o `.exe` do Windows você precisa rodar **no Windows** (ou configurar
> Wine no Linux/Mac). Cada sistema gera melhor o instalador do seu próprio SO.

Controles: `↑` acelera · `↓` freia · `← →` dirige · `Shift` nitro · `M` música ·
`F11` tela cheia · `Esc` sai da tela cheia.

---

## Sobre o nível gráfico

Este é um jogo **WebGL em um arquivo**, empacotado como app. Ele tem bloom,
reflexos (environment map), asfalto molhado, ciclo dia/tarde/noite e HUD estilo
GTA — mas **não alcança o nível AAA do GTA VI**, que exige engine nativa
(RAGE/Unreal/Unity), centenas de GB de assets e times grandes. Para esse nível
o caminho é um projeto Unreal Engine 5 / Unity com build nativo.
