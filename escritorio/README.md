# Escritório Digital — Lopes Araújo Advocacia

A empresa: sala de reunião com voz, equipe, quadro de tarefas e mural.
Publicado como página do claude.ai (capacidades: db, sample, tts, dictation).

- `index.html`, `escritorio.css`, `escritorio.js` — a página
- `avatares.js` — avatares da equipe

## Equipe e turnos (tarefas agendadas no claude.ai, fuso de Brasília)

| Funcionário | Área | Turno |
|---|---|---|
| HARVEY | Gerente geral (relatório ao Dr.) | dias úteis 7h17 |
| LOUIS | Contencioso | dias úteis 7h43 |
| DONNA | Atendimento | dias úteis 8h13 |
| MIKE | Financeiro | dias úteis 8h47 |
| JESSICA | Teses e nichos | dia 1 de cada mês 8h13 |
| ALEX | Campanhas (Meta Ads) | seg/qua/sex 9h17 |
| RACHEL | Copywriter | quarta 9h41 |
| SAMANTHA | Criativos | quarta 10h11 |

Cada turno lê e grava em `escritorio/dados/{tarefas,atividades,equipe,sala}`
no banco da página, e um colega aciona o turno do outro quando lhe passa uma tarefa.
