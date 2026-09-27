# CRM Jurídico

Sistema simples para administrar o escritório: clientes, processos, prazos, funil de leads e honorários.
Roda direto no navegador, sem servidor, sem mensalidade e sem instalar nada.

## Endereço do app

**https://adoniaslopes.github.io/campanha/**

### Ativar o link (uma única vez)

1. No GitHub, abra o repositório **campanha** → **Settings** → **Pages**.
2. Em *Build and deployment → Source*, escolha **Deploy from a branch**.
3. Em *Branch*, selecione `claude/crm-escritorio-juridico-lidq8j` e a pasta `/ (root)` → **Save**.
4. Em 1–2 minutos o endereço acima passa a funcionar. Toda alteração enviada para essa branch atualiza o app sozinha.

### Instalar como aplicativo

- **Computador (Chrome/Edge):** abra o link e clique em **⬇ Instalar app** no menu lateral (ou no ícone de instalar na barra de endereço).
- **Android (Chrome):** menu ⋮ → **Instalar app** / **Adicionar à tela inicial**.
- **iPhone (Safari):** botão Compartilhar → **Adicionar à Tela de Início**.

Depois de instalado, o CRM abre em janela própria, com ícone, e **funciona mesmo sem internet**.

> **Importante:** só o programa fica na internet. Os dados que você cadastra ficam salvos **somente no aparelho
> e navegador onde você usa o CRM** — quem abrir o link em outro aparelho vê um CRM vazio. Por isso:
> - o celular e o computador **não compartilham** os dados automaticamente; use *Backup e ajustes → Exportar backup*
>   em um e *Importar backup* no outro para levar os dados;
> - faça **backup** com frequência e guarde o arquivo em local seguro (Google Drive, pendrive).
>   O painel avisa quando o último backup tem mais de 7 dias.

Também dá para usar sem internet nenhuma: baixe o repositório (Code → Download ZIP) e abra o `index.html`.

## Módulos

| Módulo | O que faz |
|---|---|
| **Painel** | Prazos atrasados e da semana, honorários a cobrar, leads para retornar, recebido no mês |
| **Clientes** | Cadastro PF/PJ, CPF/CNPJ, WhatsApp com 1 clique, nº de benefício INSS, histórico de atendimentos |
| **Processos** | Número CNJ, tribunal, vara, situação, fase, andamentos, prazos e honorários vinculados |
| **Prazos e agenda** | Prazos, audiências, perícias e reuniões com alerta de atraso; **calculadora de prazo em dias úteis** (CPC, com feriados nacionais e recesso de 20/12 a 20/01); exportação `.ics` para o Google Agenda |
| **Funil de leads** | Kanban: novo contato → conversa → consulta → proposta → fechado/perdido; taxa de conversão; “Virar cliente” com 1 clique |
| **Financeiro** | Contratos de honorários (fixo, parcelado, êxito, mensal), parcelas geradas automaticamente, baixa de recebimento, inadimplência |
| **Backup e ajustes** | Exportar/importar backup, exportar clientes em planilha (CSV) |

## Privacidade (LGPD)

Nenhum dado de cliente sai do seu aparelho: o link publicado contém apenas o programa, sem servidor nem banco de dados.
Por isso mesmo, proteja o computador e o celular com senha/bloqueio de tela e guarde os backups em local seguro —
eles contêm dados pessoais dos clientes. **Nunca** envie arquivos de backup para este repositório (ele é público).

## Estrutura

```
index.html       página principal
manifest.webmanifest, sw.js, icons/   app instalável e uso offline
css/styles.css   visual (tema claro/escuro automático, responsivo para celular)
js/app.js        toda a lógica
```
