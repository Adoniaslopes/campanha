# Escritório Digital — Lopes Araújo Advocacia

A empresa: sala de reunião com voz, equipe, quadro de tarefas e mural.
Publicado como página do claude.ai (capacidades: db, sample, tts, dictation).

- `index.html`, `escritorio.css`, `escritorio.js` — a página
- `avatares.js` — avatares da equipe

## Equipe e turnos (tarefas agendadas no claude.ai, fuso de Brasília)

| Funcionário | Área | Turno |
|---|---|---|
| HARVY | Gerente geral (relatório ao Dr.) | dias úteis 7h17 |
| RUI | Contencioso | dias úteis 7h43 |
| LARA | Atendimento | dias úteis 8h13 |
| ÁUREO | Financeiro | dias úteis 8h47 |
| TESSA | Teses e nichos | dia 1 de cada mês 8h13 |
| GUIDO | Campanhas (Meta Ads) | seg/qua/sex 9h17 |
| PLÍNIO | Copywriter | quarta 9h41 |
| ÍRIS | Criativos | quarta 10h11 |

Cada turno lê e grava em `escritorio/dados/{tarefas,atividades,equipe,sala}`
no banco da página, e um colega aciona o turno do outro quando lhe passa uma tarefa.
