'use strict';
/* Estrutura do escritório (Projeto HARVY | AI Legal Office): Controller + 8 departamentos.
 * Cada departamento tem um diretor (agente), agentes auxiliares (com turno próprio) e skills (habilidades
 * que o diretor aplica no próprio turno). Os códigos dos agentes são os do banco do escritório. */
const ESTRUTURA = {
  controller: { id: 'claude', titulo: 'HARVEY | Controller Jurídico', missao: 'Distribui demandas, coordena prioridades, acompanha entregas, identifica gargalos, consolida informações e leva ao Dr. Adonias o que depende dele.' },
  departamentos: [
    { n: '01', sigla: 'GROWTH', nome: 'Marketing e Aquisição', diretor: 'guido', agentes: ['plinio', 'iris'], fase: 7,
      missao: 'Atrair potenciais clientes, posicionar a marca e gerar oportunidades qualificadas, dentro das normas da OAB.',
      skills: [['Traffic', 'Operação e acompanhamento das campanhas pagas'], ['Social Media', 'Redes sociais e calendário editorial'], ['SEO', 'Conteúdo e posicionamento orgânico'], ['Analytics', 'Métricas, custo por lead e atribuição'], ['Vídeo', 'Roteiros e produção audiovisual']] },
    { n: '02', sigla: 'CLOSER', nome: 'Comercial e Atendimento', diretor: 'lara', agentes: [], fase: 3,
      missao: 'Receber, acolher, qualificar e acompanhar leads até a reunião com o advogado.',
      skills: [['SDR', 'Primeiro contato e qualificação'], ['Atendimento', 'Conversa e relacionamento'], ['Objeções', 'Respostas a dúvidas, sem pressão nem promessa'], ['Follow-up', 'Retomada de contatos'], ['CRM', 'Registro e atualização de contatos'], ['Agendamento', 'Agenda e confirmações']] },
    { n: '03', sigla: 'ONBOARDING', nome: 'Reuniões, Contratos e Entrada do Cliente', diretor: 'gretchen', agentes: [], fase: 4,
      missao: 'Transformar a proposta aprovada pelo advogado em contratação formal e organizar a entrada do cliente.',
      skills: [['Intake', 'Cadastro e dados do cliente'], ['Documentos', 'Checklist e solicitação de documentos'], ['Contract', 'Minutas de contrato a partir do modelo aprovado'], ['Procuração', 'Instrumentos de representação'], ['Sign', 'Fluxo de assinatura eletrônica'], ['Conferência', 'Validação de documentos'], ['Pasta', 'Abertura e organização da pasta do cliente']] },
    { n: '04', sigla: 'JURIS', nome: 'Contencioso Jurídico', diretor: 'rui', agentes: ['kyle'], fase: 2,
      missao: 'Analisar casos, estruturar estratégias e produzir minutas de peças com fontes rastreáveis, no papel timbrado.',
      skills: [['Case Analyst', 'Análise integral dos autos'], ['Fact Mapper', 'Cronologia e fatos'], ['Legal Research', 'Pesquisa normativa e jurisprudencial verificável'], ['Petition', 'Minutas de peças'], ['Appeals', 'Recursos e contrarrazões'], ['Evidence', 'Análise documental e probatória'], ['Procedural', 'Requisitos e estratégia processual'], ['Legal Review', 'Revisão técnica e consistência']] },
    { n: '05', sigla: 'INTEL', nome: 'Pesquisa, Teses e Novas Demandas', diretor: 'tessa', agentes: [], fase: 8,
      missao: 'Identificar mudanças jurídicas, desenvolver teses e avaliar novas frentes com critério jurídico e econômico.',
      skills: [['Legis', 'Monitoramento legislativo'], ['Precedent', 'Jurisprudência'], ['Thesis', 'Desenvolvimento de teses'], ['Market Intel', 'Inteligência de mercado'], ['Opportunity', 'Identificação de demandas'], ['Feasibility', 'Viabilidade jurídica e econômica']] },
    { n: '06', sigla: 'DOCKET', nome: 'Protocolo e Gestão Processual', diretor: 'benjamin', agentes: [], fase: 5,
      missao: 'Acompanhar processos e controlar prazos com redundância; preparar protocolos só com autorização.',
      skills: [['Protocol', 'Preparação e registro de protocolos'], ['Docket', 'Cadastro e gestão de processos'], ['Deadline', 'Controle e alertas de prazo, com conferência'], ['Monitor', 'Monitoramento processual'], ['Publication', 'Leitura de intimações'], ['Client Update', 'Atualização de andamento ao cliente']] },
    { n: '07', sigla: 'FINANCE', nome: 'Financeiro e Cobrança', diretor: 'aureo', agentes: [], fase: 6,
      missao: 'Controlar honorários, recebimentos, despesas, inadimplência e indicadores financeiros.',
      skills: [['Billing', 'Faturamento'], ['Collection', 'Cobrança dentro da política aprovada'], ['Accounts', 'Contas a pagar e receber'], ['Cash Flow', 'Fluxo de caixa'], ['Contract Control', 'Honorários e parcelas'], ['Profitability', 'Rentabilidade']] },
    { n: '08', sigla: 'SENTINEL', nome: 'Gestão, Qualidade e Compliance', diretor: 'faye', agentes: [], fase: 9,
      missao: 'Auditar processos e agentes, monitorar conformidade (OAB e LGPD), segurança, qualidade e desempenho.',
      skills: [['Audit', 'Auditoria operacional'], ['Quality', 'Controle de qualidade das peças'], ['LGPD', 'Proteção de dados'], ['Compliance', 'Conformidade com a OAB'], ['Security', 'Segurança e permissões'], ['KPI', 'Indicadores']] },
  ],
};
if (typeof window !== 'undefined') window.ESTRUTURA = ESTRUTURA;
