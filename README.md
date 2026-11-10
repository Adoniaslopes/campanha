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

### Login e banco online

O CRM guarda os dados no **banco online do escritório** (Supabase, servidor em São Paulo), com login por e-mail e senha.
Os dados aparecem iguais no celular e no computador e ficam prontos para os agentes do escritório usarem.
Sem internet, o app continua funcionando e envia as alterações quando a conexão volta.

- Primeiro acesso: na tela de login, clique em **Primeiro acesso? Criar conta**, confirme o e-mail e entre.
- Os dados que já estavam salvos só no aparelho são oferecidos para envio ao banco no primeiro login.
- **Sair** (no menu) apaga a cópia local do aparelho, útil em computador compartilhado.

#### Configuração do Supabase (uma vez, no painel do Supabase, projeto `escritorio-lopes-araujo`)

1. **Authentication → URL Configuration → Site URL:** `https://adoniaslopes.github.io/campanha/`
   (e o mesmo endereço em *Redirect URLs*). Assim os links de confirmação e de "Esqueci a senha" abrem o CRM.
2. Depois de criar a sua conta: **Authentication → Sign In / Providers → desligar "Allow new users to sign up"**,
   para ninguém mais criar conta. Mesmo sem isso, cada conta só enxerga os próprios dados (regras de segurança RLS).

#### Modelo de dados

| Tabela | Conteúdo |
|---|---|
| `leads` | Funil de captação (etapa, origem, empresa, data de saída do emprego) |
| `clientes` | Cadastro e histórico de atendimentos |
| `casos` | Processos, com dados do contrato de trabalho (função, admissão, saída, salário, como saiu) e andamentos |
| `prazos` | Prazos, audiências, perícias, reuniões e tarefas |
| `contratos` | Honorários e parcelas; a visão `parcelas` lista cada parcela em uma linha |

Também dá para usar sem internet nenhuma: baixe o repositório (Code → Download ZIP) e abra o `index.html`.

## Módulos

| Módulo | O que faz |
|---|---|
| **Painel** | Prazos atrasados e da semana, honorários a cobrar, leads para retornar, recebido no mês |
| **Clientes** | Cadastro PF/PJ, CPF/CNPJ, WhatsApp com 1 clique, histórico de atendimentos |
| **Processos** | Número CNJ, TRT e vara, dados do contrato de trabalho, **alerta do prazo de 2 anos para ajuizar**, andamentos, prazos e honorários |
| **Prazos e agenda** | Prazos, audiências, perícias e reuniões com alerta de atraso; **calculadora de prazo em dias úteis** (CPC, com feriados nacionais e recesso de 20/12 a 20/01); exportação `.ics` para o Google Agenda |
| **Funil de leads** | Kanban: novo contato → conversa → consulta → proposta → fechado/perdido; taxa de conversão; “Virar cliente” com 1 clique |
| **Financeiro** | Contratos de honorários (fixo, parcelado, êxito, mensal), parcelas geradas automaticamente, baixa de recebimento, inadimplência |
| **Backup e ajustes** | Exportar/importar backup, exportar clientes em planilha (CSV) |

## Privacidade (LGPD)

Os dados ficam no banco do escritório no Supabase, em servidor no Brasil (São Paulo), acessíveis só com o seu login.
A chave que aparece no código é a chave pública do projeto; quem protege os dados são o login e as regras de segurança do banco.
Proteja o computador e o celular com senha/bloqueio de tela e guarde os backups em local seguro — eles contêm dados pessoais dos clientes. **Nunca** envie arquivos de backup para este repositório (ele é público).

## Estrutura

```
index.html       página principal
manifest.webmanifest, sw.js, icons/   app instalável e uso offline
css/styles.css   visual (tema claro/escuro automático, responsivo para celular)
js/app.js        telas e regras do CRM
js/nuvem.js      login e sincronização com o banco online
js/vendor/       biblioteca oficial do Supabase (cópia local, funciona offline)
```
