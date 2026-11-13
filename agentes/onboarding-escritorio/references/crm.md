# CRM do escritório — como o Agente de Atendimento lê e grava leads

O CRM é a página **CRM Jurídico** no claude.ai:
`https://claude.ai/artifact/3HNhXEqp4WWjLtJ7dYUJtX`

Os dados ficam no banco da página. Use a ferramenta de dados de artifact
(`ArtifactData`, ou `read_db`/`write_db`) sempre com esse `url`. Só o dono lê e grava.

## Onde ficam os leads

- Coleção: `crm/escritorio/leads`
- Um documento por lead; o `doc_id` é igual ao campo `id` do documento.

## Campos de um lead

| Campo | Tipo | Conteúdo |
|---|---|---|
| `id` | texto | Identificador único (igual ao `doc_id`). Gere com letras minúsculas e números, ex.: `lead` + data/hora em base 36 + 4 letras aleatórias |
| `criadoEm` | texto ISO | Data e hora de criação, ex.: `2026-11-10T14:05:00.000Z` |
| `nome` | texto | Nome da pessoa (obrigatório) |
| `telefone` | texto | Formato `(62) 99999-1234` |
| `email` | texto | Se informado |
| `origem` | texto | `WhatsApp`, `Site`, `Instagram`, `Facebook`, `Google`, `Indicação`, `Campanha` ou `Outro` |
| `area` | texto | `Trabalhista` (padrão) ou outra área, se for o caso |
| `etapa` | texto | `novo`, `conversa`, `consulta`, `proposta`, `fechado` ou `perdido` |
| `empresa` | texto | Empregador (ou a própria empresa, se o lead for uma empresa) |
| `dataSaida` | data `AAAA-MM-DD` | Saída do emprego; vazio se ainda trabalha. É o que alimenta o alerta do prazo de 2 anos no CRM |
| `proximoContato` | data `AAAA-MM-DD` | Próximo retorno ou a data da consulta agendada |
| `valorEstimado` | número ou `null` | Não preencha: é do advogado |
| `motivoPerda` | texto | Só quando `etapa` = `perdido` |
| `descricao` | texto | Histórico: uma linha por acontecimento, `DD/MM/AAAA — o que houve`, e o resumo para o advogado |
| `clienteId` | texto | Vazio; o advogado preenche ao converter em cliente |
| `tentativas` | número | Retomadas de follow-up já feitas (0, 1 ou 2) |
| `ultimoContato` | data `AAAA-MM-DD` | Última mensagem enviada pelo escritório |

Mantenha todos os campos ao atualizar: use `update` (mescla) e nunca apague campos que você não conhece.

## Operações

**Procurar por telefone antes de criar** (evita duplicar):

```
ArtifactData action=query url=<CRM> collection=crm/escritorio/leads
  query={"where": [["telefone", "==", "(62) 99999-1234"]]}
```

**Criar um lead** (documento novo, sem `if_version`):

```
ArtifactData action=set url=<CRM> collection=crm/escritorio/leads doc_id=leadmhb3x2k9
  data={"id": "leadmhb3x2k9", "criadoEm": "2026-11-10T14:05:00.000Z", "nome": "Ana Lúcia Ramos",
        "telefone": "(62) 97777-0001", "email": "", "origem": "WhatsApp", "area": "Trabalhista",
        "etapa": "novo", "empresa": "", "dataSaida": "", "proximoContato": "2026-11-10",
        "valorEstimado": null, "motivoPerda": "", "clienteId": "", "tentativas": 0,
        "ultimoContato": "2026-11-10",
        "descricao": "10/11/2026 — Chamou no WhatsApp: rescisão paga a menor."}
```

**Atualizar** (leia antes e passe o `version` lido como `if_version`):

```
ArtifactData action=update url=<CRM> collection=crm/escritorio/leads doc_id=leadmhb3x2k9 if_version=3
  data={"etapa": "consulta", "proximoContato": "2026-11-12", "empresa": "Supermercado Gama",
        "dataSaida": "2026-09-05",
        "descricao": "<histórico anterior>\n12/11/2026 — Consulta marcada para 12/11 às 10h (vídeo).\n<resumo para o advogado>"}
```

**Quem retornar hoje**:

```
ArtifactData action=query url=<CRM> collection=crm/escritorio/leads
  query={"where": [["etapa", "in", ["novo", "conversa"]], ["proximoContato", "<=", "<hoje AAAA-MM-DD>"]]}
```

O CRM aberto no celular ou no computador recebe essas mudanças na hora.

## Se a ferramenta não estiver disponível

Monte o registro com os campos acima e entregue ao usuário, dizendo claramente que **não foi gravado**.
