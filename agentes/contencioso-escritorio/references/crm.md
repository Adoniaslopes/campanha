# CRM do escritório — casos, prazos e clientes

O CRM é a página **CRM Jurídico** no claude.ai: `https://claude.ai/artifact/3HNhXEqp4WWjLtJ7dYUJtX`.
Use a ferramenta de dados de artifact (`ArtifactData`, ou `read_db`/`write_db`) sempre com esse `url`.
O CRM aberto no celular ou no computador recebe as mudanças na hora.

Coleções (um documento por registro; o `doc_id` é igual ao campo `id`):

| Coleção | Conteúdo |
|---|---|
| `crm/escritorio/processos` | Casos e processos |
| `crm/escritorio/eventos` | Prazos, audiências, perícias, reuniões e tarefas |
| `crm/escritorio/clientes` | Clientes |
| `crm/escritorio/honorarios` | Contratos de honorários (não altere: é do Agente Financeiro) |

Ao atualizar, use `update` com o `version` lido em `if_version`, e mande só os campos que mudam.
Listas (`andamentos`) são substituídas inteiras: leia, acrescente o item novo e envie a lista completa.
Ids novos: letras minúsculas e números, únicos (ex.: `and` + data/hora em base 36 + 4 letras).
Datas: `AAAA-MM-DD`. Valores: número (ex.: `3200`).

## Caso (`crm/escritorio/processos`)

| Campo | Conteúdo |
|---|---|
| `id`, `criadoEm` | Identificador e data ISO de criação |
| `clienteId` | `id` do cliente |
| `numero` | Número CNJ, ex.: `0010123-45.2026.5.18.0005` (vazio se não ajuizado) |
| `area` | `Trabalhista` (padrão) |
| `tipoAcao` | Tipo de ação / pedidos principais |
| `polo` | `Reclamante`, `Reclamado`, `Autor`, `Réu` ou `Terceiro` |
| `parteContraria` | Parte contrária / empregador |
| `funcao`, `admissao`, `saida`, `ultimoSalario`, `motivoSaida` | Contrato de trabalho (`motivoSaida`: Dispensa sem justa causa, Dispensa por justa causa, Pedido de demissão, Rescisão indireta, Acordo (art. 484-A CLT), Término de contrato, Ainda trabalha na empresa) |
| `tribunal`, `vara`, `comarca` | Ex.: `TRT18`, `5ª Vara do Trabalho`, `Goiânia` |
| `status` | `Ativo`, `Aguardando julgamento`, `Em recurso`, `Em execução`, `Suspenso`, `Acordo`, `Encerrado - procedente`, `Encerrado - improcedente`, `Arquivado` |
| `fase` | `Pré-processual`, `Conhecimento`, `Recursal`, `Execução` |
| `valorCausa` | Número |
| `distribuicao` | Data de distribuição |
| `link` | Link de consulta no PJe |
| `observacoes` | Texto livre (pesquisas longas podem ir aqui, com data) |
| `andamentos` | Lista `[{"id": "...", "data": "AAAA-MM-DD", "descricao": "..."}]` |

## Prazo / compromisso (`crm/escritorio/eventos`)

| Campo | Conteúdo |
|---|---|
| `id`, `criadoEm` | Identificador e data ISO |
| `tipo` | `Prazo`, `Audiência`, `Perícia`, `Reunião` ou `Tarefa` |
| `prioridade` | `Normal` ou `Alta` |
| `titulo` | Descrição curta, ex.: `Recurso ordinário` |
| `data`, `hora` | `AAAA-MM-DD` e `HH:MM` (hora pode ficar vazia) |
| `processoId`, `clienteId` | Ligações com o caso e o cliente |
| `local` | Endereço ou link da sala virtual |
| `observacoes` | A conta do prazo: intimação em X, N dias úteis, regra usada |
| `concluido` | `false` ao criar |

## Exemplos

Achar caso pelo número:
```
ArtifactData action=query url=<CRM> collection=crm/escritorio/processos
  query={"where": [["numero", "==", "0010123-45.2026.5.18.0005"]]}
```

Prazos dos próximos 7 dias:
```
ArtifactData action=query url=<CRM> collection=crm/escritorio/eventos
  query={"where": [["concluido", "==", false], ["data", "<=", "<hoje + 7>"]], "order_by": {"field": "data"}, "limit": 200}
```

Criar prazo:
```
ArtifactData action=set url=<CRM> collection=crm/escritorio/eventos doc_id=evtmhc1a2b3x
  data={"id": "evtmhc1a2b3x", "criadoEm": "2026-11-10T15:00:00.000Z", "tipo": "Prazo", "prioridade": "Alta",
        "titulo": "Recurso ordinário", "data": "2026-11-24", "hora": "", "processoId": "<id do caso>",
        "clienteId": "<id do cliente>", "local": "", "concluido": false,
        "observacoes": "Intimação da sentença em 11/11/2026; 8 dias úteis (art. 895 CLT). Conferir no PJe."}
```
