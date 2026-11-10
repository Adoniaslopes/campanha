# CRM do escritório — leads para marketing

O CRM é a página **CRM Jurídico** no claude.ai: `https://claude.ai/artifact/3HNhXEqp4WWjLtJ7dYUJtX`.
Use a ferramenta de dados de artifact (`ArtifactData`, ou `read_db`/`write_db`) sempre com esse `url`.

Coleção: `crm/escritorio/leads` (um documento por lead; `doc_id` = campo `id`).

Campos usados pelo marketing:

| Campo | Conteúdo |
|---|---|
| `id`, `criadoEm` | Identificador e data ISO de criação (use `criadoEm` para filtrar o período) |
| `nome`, `telefone`, `email` | Contato |
| `origem` | `Site`, `Indicação`, `Instagram`, `Facebook`, `Google`, `WhatsApp`, `Campanha` ou `Outro` |
| `area` | `Trabalhista` (padrão) |
| `etapa` | `novo`, `conversa`, `consulta`, `proposta`, `fechado` ou `perdido` |
| `motivoPerda` | Por que não fechou |
| `valorEstimado` | Honorários estimados pelo advogado |
| `descricao` | Histórico; a 1ª linha de um lead de campanha traz `Campanha: <nome>` |

Leads do período (pagine com `cursor` se houver mais de 1000):
```
ArtifactData action=query url=<CRM> collection=crm/escritorio/leads
  query={"where": [["criadoEm", ">=", "2026-10-11T00:00:00.000Z"]], "limit": 1000}
```

Criar um lead vindo de campanha (o Agente de Atendimento continua dali):
```
ArtifactData action=set url=<CRM> collection=crm/escritorio/leads doc_id=leadmhd0k1q2
  data={"id": "leadmhd0k1q2", "criadoEm": "2026-11-10T16:00:00.000Z", "nome": "...", "telefone": "(62) 9....-....",
        "email": "", "origem": "Instagram", "area": "Trabalhista", "etapa": "novo", "empresa": "", "dataSaida": "",
        "proximoContato": "2026-11-10", "valorEstimado": null, "motivoPerda": "", "clienteId": "", "tentativas": 0,
        "ultimoContato": "", "descricao": "Campanha: Prazo de 2 anos — nov/2026\n10/11/2026 — Chegou pelo anúncio."}
```
Antes de criar, procure pelo telefone para não duplicar (`where telefone == ...`).
