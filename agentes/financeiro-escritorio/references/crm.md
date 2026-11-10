# CRM do escritório — contratos de honorários

O CRM é a página **CRM Jurídico** no claude.ai: `https://claude.ai/artifact/3HNhXEqp4WWjLtJ7dYUJtX`.
Use a ferramenta de dados de artifact (`ArtifactData`, ou `read_db`/`write_db`) sempre com esse `url`.
O CRM aberto no celular ou no computador recebe as mudanças na hora.

| Coleção | Conteúdo |
|---|---|
| `crm/escritorio/honorarios` | Contratos de honorários e suas parcelas |
| `crm/escritorio/clientes` | Clientes (nome, telefone, e-mail) — só leitura para este agente |
| `crm/escritorio/processos` | Casos (situação, valor da causa) — só leitura para este agente |

Um documento por registro; o `doc_id` é igual ao campo `id`. Ao atualizar, use `update` com o `version`
lido em `if_version`. Listas (`parcelas`, `cobrancas`) são substituídas inteiras: leia, altere e envie a lista completa.
Datas `AAAA-MM-DD`; valores em número (ex.: `500` ou `333.34`).

## Contrato (`crm/escritorio/honorarios`)

| Campo | Conteúdo |
|---|---|
| `id`, `criadoEm` | Identificador e data ISO de criação |
| `clienteId` | `id` do cliente (obrigatório) |
| `processoId` | `id` do caso, ou vazio |
| `descricao` | Ex.: `Honorários contratuais — reclamação trabalhista` |
| `tipo` | `Fixo (à vista)`, `Parcelado`, `Êxito`, `Mensal (partido)` ou `Consulta` |
| `percentualExito` | Número (ex.: `30`) ou `null` |
| `dataContrato` | Data do contrato |
| `observacoes` | Texto livre; renegociações ficam registradas aqui, com data |
| `parcelas` | Lista de parcelas (abaixo) |
| `cobrancas` | Lista de cobranças enviadas: `[{"data": "AAAA-MM-DD", "parcelaId": "...", "canal": "WhatsApp", "etapa": 1}]` |

Parcela:
```
{"id": "p1x9k2", "numero": 1, "vencimento": "2026-12-10", "valor": 500,
 "pago": false, "dataPagamento": "", "forma": "", "obs": ""}
```

## Exemplos

Contratos de um cliente:
```
ArtifactData action=query url=<CRM> collection=crm/escritorio/honorarios
  query={"where": [["clienteId", "==", "<id do cliente>"]]}
```

Todos os contratos (para atrasos e fechamento do mês; pagine com `cursor` se houver mais de 1000):
```
ArtifactData action=list url=<CRM> collection=crm/escritorio/honorarios query={"limit": 1000}
```

Dar baixa (lido na versão 4):
```
ArtifactData action=update url=<CRM> collection=crm/escritorio/honorarios doc_id=<id> if_version=4
  data={"parcelas": [ ...lista completa, com a parcela paga como {"pago": true, "dataPagamento": "2026-11-10", "forma": "PIX", ...} ]}
```
