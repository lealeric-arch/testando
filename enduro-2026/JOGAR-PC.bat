@echo off
rem ENDURO 2026 CITY - abre o jogo em tela cheia (modo aplicativo), sem instalar nada.
setlocal
set "GAME=%~dp0index3d.html"
set "URL=file:///%GAME:\=/%"

rem Tenta o Microsoft Edge (presente em todo Windows 10/11), depois o Chrome,
rem e por fim abre no navegador padrao.
start "" msedge --app="%URL%" --start-fullscreen 2>nul && goto fim
start "" chrome --app="%URL%" --start-fullscreen 2>nul && goto fim
start "" "%GAME%"
:fim
endlocal
