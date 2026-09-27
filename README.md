# CRM Jurídico

Sistema simples para administrar o escritório: clientes, processos, prazos, funil de leads e honorários.
Roda direto no navegador, sem servidor, sem mensalidade e sem instalar nada.

## Como usar

1. Baixe o repositório (botão **Code → Download ZIP** no GitHub) e descompacte.
2. Dê dois cliques em `index.html` — abre no navegador (Chrome, Edge ou Firefox).
3. Na primeira vez, clique em **Carregar exemplo** para conhecer o sistema; depois apague em *Backup e ajustes*.

> **Importante:** os dados ficam salvos **somente no navegador do computador onde você usa o CRM**.
> Faça **backup** com frequência (*Backup e ajustes → Exportar backup*) e guarde o arquivo em local seguro
> (Google Drive, pendrive). Para usar em outro computador, importe o backup lá.
> O painel avisa quando o último backup tem mais de 7 dias.

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

Nenhum dado sai do seu computador: não há servidor nem envio para a internet. Por isso mesmo,
proteja o computador com senha e guarde os backups em local seguro — eles contêm dados pessoais dos clientes.
**Não publique** este CRM com dados reais em sites públicos (ex.: GitHub Pages).

## Estrutura

```
index.html       página principal
css/styles.css   visual (tema claro/escuro automático, responsivo para celular)
js/app.js        toda a lógica
```
