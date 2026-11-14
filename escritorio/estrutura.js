'use strict';
/* Estrutura do escritório (HARVY | AI Legal Office): Controller + 7 unidades (reorganizado em 13/11/2026 pelo Dr. Adonias).
 * Base: Constituição Operacional do Escritório (11/11/2026). Cada unidade tem um diretor (agente) e skills
 * (habilidades que o diretor comanda). GROWTH e SENTINEL ainda não têm diretor: o Controller responde por elas. DOCKET é do ALEX.
 * Os códigos dos diretores (claude, lara, plinio, rui, aureo, tessa, guido, iris) são os do banco do escritório.
 * Quem é quem: claude=HARVEY, lara=DONNA, plinio=RACHEL, rui=LOUIS, aureo=MIKE, tessa=JESSICA, guido=ALEX, iris=SAMANTHA. */
const ESTRUTURA = {
  controller: { id: 'claude', titulo: 'HARVEY | Controller do Escritório', missao: 'Distribui demandas, coordena prioridades, acompanha entregas, identifica gargalos, consolida informações e leva ao Dr. Adonias o que depende dele. Responde por GROWTH e SENTINEL enquanto elas não têm diretor.' },
  departamentos: [
    { n: '01', sigla: 'GROWTH', nome: 'Marketing e Aquisição', diretor: null, agentes: [], fase: 7,
      missao: 'Atrair potenciais clientes para a frente trabalhista, posicionar a marca e gerar oportunidades qualificadas, dentro das normas da OAB.',
      skills: [['Copywriter', 'Textos, anúncios e páginas'], ['Designer', 'Criativos e identidade visual'], ['Traffic', 'Operação e acompanhamento das campanhas pagas'], ['Social Media', 'Redes sociais e calendário editorial'], ['SEO', 'Conteúdo e posicionamento orgânico'], ['Analytics', 'Métricas, custo por lead e atribuição'], ['Vídeo', 'Roteiros e produção audiovisual']] },
    { n: '02', sigla: 'CLOSER', nome: 'Comercial e Atendimento', diretor: 'lara', agentes: [], fase: 3,
      missao: 'Receber, acolher, qualificar e acompanhar leads até a reunião com o advogado. Só faz triagem, coleta e agendamento: não negocia, não fala de honorários e não dá orientação jurídica.',
      skills: [['SDR', 'Primeiro contato e qualificação'], ['Atendimento', 'Conversa e relacionamento'], ['Follow-up', 'Retomada de contatos'], ['CRM', 'Registro e atualização de contatos'], ['Agendamento', 'Agenda e confirmações']] },
    { n: '03', sigla: 'ONBOARDING', nome: 'Reuniões, Contratos e Entrada do Cliente', diretor: 'plinio', agentes: [], fase: 4,
      missao: 'Transformar a proposta aprovada pelo advogado em contratação formal e organizar a entrada do cliente, com conferência de conflito de interesses e consentimento de IA no contrato.',
      skills: [['Intake', 'Cadastro e dados do cliente'], ['Documentos', 'Checklist e solicitação de documentos'], ['Contract', 'Minutas de contrato a partir do modelo aprovado'], ['Procuração', 'Instrumentos de representação'], ['Sign', 'Fluxo de assinatura eletrônica'], ['Conferência', 'Validação de documentos'], ['Pasta', 'Abertura e organização da pasta do cliente']] },
    { n: '04', sigla: 'JURÍDICO', nome: 'Departamento Jurídico', diretor: 'tessa', agentes: ['rui', 'aureo'], fase: 2,
      missao: 'Toda a parte jurídica do escritório, sob a direção da JESSICA, que também desenvolve as novas teses e faz o aconselhamento dos casos e a jurisprudência. LOUIS conduz os casos cíveis complexos (Atibaia, TJSP e STJ); MIKE cuida dos processos trabalhistas. Tudo com fontes rastreáveis e minutas para a revisão do Dr. Adonias.',
      skills: [['Direção e Teses', 'Distribuição dos casos, novas teses e aconselhamento (Jessica)'], ['Jurisprudência', 'Pesquisa com fonte verificável (Jessica)'], ['Casos Complexos', 'Execução de Atibaia e recursos no TJSP e STJ (Louis)'], ['Trabalhista', 'Reclamações, defesas e cálculos (Mike)'], ['Case Analyst', 'Análise integral dos autos'], ['Petition', 'Minutas de peças'], ['Appeals', 'Recursos e contrarrazões'], ['Evidence', 'Análise documental e probatória']] },
    { n: '05', sigla: 'DOCKET', nome: 'Protocolo e Gestão Processual', diretor: 'guido', agentes: [], fase: 5,
      missao: 'Acompanhar processos e controlar prazos com redundância, no rito da CLT e no do CPC; preparar protocolos só com autorização e sob supervisão do Dr. Adonias.',
      skills: [['Protocol', 'Preparação e registro de protocolos'], ['Docket', 'Cadastro e gestão de processos'], ['Deadline', 'Controle e alertas de prazo, com conferência'], ['Monitor', 'Monitoramento processual'], ['Publication', 'Leitura de intimações'], ['Court System', 'Integrações com sistemas judiciais'], ['Client Update', 'Atualização de andamento ao cliente']] },
    { n: '06', sigla: 'FINANCE', nome: 'Financeiro e Cobrança', diretor: 'iris', agentes: [], fase: 6,
      missao: 'Controlar honorários, recebimentos, despesas, inadimplência e indicadores financeiros. Valores, descontos e estornos dependem do Dr. Adonias.',
      skills: [['Billing', 'Faturamento'], ['Collection', 'Cobrança dentro da política aprovada'], ['Accounts', 'Contas a pagar e receber'], ['Cash Flow', 'Fluxo de caixa'], ['Financial Report', 'Relatórios financeiros'], ['Contract Control', 'Honorários e parcelas'], ['Profitability', 'Rentabilidade']] },
    { n: '07', sigla: 'SENTINEL', nome: 'Gestão, Qualidade e Compliance', diretor: null, agentes: [], fase: 9,
      missao: 'Auditar processos e agentes de forma independente, monitorar conformidade (OAB e LGPD), segurança, qualidade e desempenho.',
      skills: [['Audit', 'Auditoria operacional'], ['Quality', 'Controle de qualidade das peças'], ['LGPD', 'Proteção de dados'], ['Compliance', 'Conformidade com a OAB'], ['Security', 'Segurança e permissões'], ['KPI', 'Indicadores'], ['Process', 'Otimização de processos']] },
  ],
};
if (typeof window !== 'undefined') window.ESTRUTURA = ESTRUTURA;

/* Organograma estrutural (aba Mural), definido pelo Dr. Adonias em 14/11/2026.
 * id: código do banco quando a pessoa já trabalha no escritório; os nomeados ainda não ativados usam um id próprio
 * e foto em org/<id>.jpg (publicada só no artifact privado). ativo: false = nomeado, a ativar. */
const ORGANOGRAMA = {
  socio: { id: 'adonias', nome: 'Dr. Adonias Lopes de Araújo', cargo: 'Sócio diretor e fundador', foto: 'org/adonias.jpg' },
  controller: { id: 'claude', nome: 'Harvey', cargo: 'Controller' },
  diretorias: [
    { nome: 'Marketing', gerente: { id: 'katrina', nome: 'Katrina Bennett', cargo: 'Gerente de Marketing', ativo: false },
      equipe: [
        { id: 'tara', nome: 'Tara Messer', cargo: 'Criativos', ativo: false },
        { id: 'trevor', nome: 'Trevor Evans', cargo: 'Roteiro e copy', ativo: false },
        { id: 'brian', nome: 'Brian Altman', cargo: 'Gestor de tráfego', ativo: false },
        { id: 'jenny', nome: 'Jenny Griffith', cargo: 'Redes sociais', ativo: false },
      ] },
    { nome: 'Comercial', gerente: { id: 'lara', nome: 'Donna', cargo: 'Gerente comercial' },
      equipe: [
        { id: 'plinio', nome: 'Rachel', cargo: 'Fechamento: contrato, procuração e call' },
      ] },
    { nome: 'Jurídico', gerente: { id: 'tessa', nome: 'Jessica', cargo: 'Diretora jurídica' },
      equipe: [
        { id: 'rui', nome: 'Louis', cargo: 'Casos complexos' },
        { id: 'aureo', nome: 'Mike', cargo: 'Trabalhista' },
        { id: 'guido', nome: 'Alex', cargo: 'Protocolo e prazos' },
        { id: 'gretchen', nome: 'Gretchen Bodinski', cargo: 'Atendimento sobre o processo', ativo: false },
      ] },
    { nome: 'Financeiro', gerente: { id: 'iris', nome: 'Samantha', cargo: 'Diretora financeira' },
      equipe: [
        { id: 'harold', nome: 'Harold Gunderson', cargo: 'Guias, custas e administrativo', ativo: false },
      ] },
    { nome: 'Compliance', gerente: { id: 'faye', nome: 'Faye Richardson', cargo: 'Qualidade, LGPD e ética OAB', ativo: false },
      equipe: [] },
  ],
};
if (typeof window !== 'undefined') window.ORGANOGRAMA = ORGANOGRAMA;
