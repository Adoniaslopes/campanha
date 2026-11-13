'use strict';
/* Estrutura do escritório (HARVY | AI Legal Office): Controller + 9 unidades.
 * Base: Constituição Operacional do Escritório (11/11/2026). Cada unidade tem um diretor (agente) e skills
 * (habilidades que o diretor comanda). DOCKET e FINANCE ainda não têm diretor: o Controller responde por elas.
 * Os códigos dos diretores (claude, lara, plinio, rui, aureo, tessa, guido, iris) são os do banco do escritório.
 * Quem é quem: claude=HARVEY, lara=DONNA, plinio=RACHEL, rui=LOUIS, aureo=MIKE, tessa=JESSICA, guido=ALEX, iris=SAMANTHA. */
const ESTRUTURA = {
  controller: { id: 'claude', titulo: 'HARVEY | Controller Jurídico', missao: 'Distribui demandas, coordena prioridades, acompanha entregas, identifica gargalos, consolida informações e leva ao Dr. Adonias o que depende dele. Responde por DOCKET e FINANCE enquanto elas não têm diretor.' },
  departamentos: [
    { n: '01', sigla: 'GROWTH', nome: 'Marketing e Aquisição', diretor: 'guido', agentes: [], fase: 7,
      missao: 'Atrair potenciais clientes para a frente trabalhista, posicionar a marca e gerar oportunidades qualificadas, dentro das normas da OAB.',
      skills: [['Copywriter', 'Textos, anúncios e páginas'], ['Designer', 'Criativos e identidade visual'], ['Traffic', 'Operação e acompanhamento das campanhas pagas'], ['Social Media', 'Redes sociais e calendário editorial'], ['SEO', 'Conteúdo e posicionamento orgânico'], ['Analytics', 'Métricas, custo por lead e atribuição'], ['Vídeo', 'Roteiros e produção audiovisual']] },
    { n: '02', sigla: 'CLOSER', nome: 'Comercial e Atendimento', diretor: 'lara', agentes: [], fase: 3,
      missao: 'Receber, acolher, qualificar e acompanhar leads até a reunião com o advogado. Só faz triagem, coleta e agendamento: não negocia, não fala de honorários e não dá orientação jurídica.',
      skills: [['SDR', 'Primeiro contato e qualificação'], ['Atendimento', 'Conversa e relacionamento'], ['Follow-up', 'Retomada de contatos'], ['CRM', 'Registro e atualização de contatos'], ['Agendamento', 'Agenda e confirmações']] },
    { n: '03', sigla: 'ONBOARDING', nome: 'Reuniões, Contratos e Entrada do Cliente', diretor: 'plinio', agentes: [], fase: 4,
      missao: 'Transformar a proposta aprovada pelo advogado em contratação formal e organizar a entrada do cliente, com conferência de conflito de interesses e consentimento de IA no contrato.',
      skills: [['Intake', 'Cadastro e dados do cliente'], ['Documentos', 'Checklist e solicitação de documentos'], ['Contract', 'Minutas de contrato a partir do modelo aprovado'], ['Procuração', 'Instrumentos de representação'], ['Sign', 'Fluxo de assinatura eletrônica'], ['Conferência', 'Validação de documentos'], ['Pasta', 'Abertura e organização da pasta do cliente']] },
    { n: '04', sigla: 'JURIS', nome: 'Contencioso Jurídico', diretor: 'rui', agentes: [], fase: 2,
      missao: 'Analisar casos, estruturar estratégias e produzir minutas de peças com fontes rastreáveis, para revisão do Dr. Adonias. Apoia o Mike na revisão técnica dos casos complexos.',
      skills: [['Case Analyst', 'Análise integral dos autos'], ['Fact Mapper', 'Cronologia e fatos'], ['Legal Research', 'Pesquisa normativa e jurisprudencial verificável'], ['Petition', 'Minutas de peças'], ['Appeals', 'Recursos e contrarrazões'], ['Evidence', 'Análise documental e probatória'], ['Procedural', 'Requisitos e estratégia processual'], ['Legal Review', 'Revisão técnica e consistência']] },
    { n: '05', sigla: 'INTEL', nome: 'Pesquisa, Teses e Novas Demandas', diretor: 'tessa', agentes: [], fase: 8,
      missao: 'Identificar mudanças jurídicas, desenvolver teses com fontes verificáveis e avaliar novas frentes com critério jurídico e econômico. Entrega pesquisa ao Mike e ao Louis.',
      skills: [['Legis', 'Monitoramento legislativo'], ['Precedent', 'Jurisprudência'], ['Thesis', 'Desenvolvimento de teses'], ['Market Intel', 'Inteligência de mercado'], ['Opportunity', 'Identificação de demandas'], ['Competitor', 'Monitoramento concorrencial lícito'], ['Feasibility', 'Viabilidade jurídica e econômica']] },
    { n: '06', sigla: 'DOCKET', nome: 'Protocolo e Gestão Processual', diretor: null, agentes: [], fase: 5,
      missao: 'Acompanhar processos e controlar prazos com redundância, no rito da CLT e no do CPC; preparar protocolos só com autorização e sob supervisão do Dr. Adonias.',
      skills: [['Protocol', 'Preparação e registro de protocolos'], ['Docket', 'Cadastro e gestão de processos'], ['Deadline', 'Controle e alertas de prazo, com conferência'], ['Monitor', 'Monitoramento processual'], ['Publication', 'Leitura de intimações'], ['Court System', 'Integrações com sistemas judiciais'], ['Client Update', 'Atualização de andamento ao cliente']] },
    { n: '07', sigla: 'FINANCE', nome: 'Financeiro e Cobrança', diretor: null, agentes: [], fase: 6,
      missao: 'Controlar honorários, recebimentos, despesas, inadimplência e indicadores financeiros. Valores, descontos e estornos dependem do Dr. Adonias.',
      skills: [['Billing', 'Faturamento'], ['Collection', 'Cobrança dentro da política aprovada'], ['Accounts', 'Contas a pagar e receber'], ['Cash Flow', 'Fluxo de caixa'], ['Financial Report', 'Relatórios financeiros'], ['Contract Control', 'Honorários e parcelas'], ['Profitability', 'Rentabilidade']] },
    { n: '08', sigla: 'SENTINEL', nome: 'Gestão, Qualidade e Compliance', diretor: 'iris', agentes: [], fase: 9,
      missao: 'Auditar processos e agentes de forma independente, monitorar conformidade (OAB e LGPD), segurança, qualidade e desempenho.',
      skills: [['Audit', 'Auditoria operacional'], ['Quality', 'Controle de qualidade das peças'], ['LGPD', 'Proteção de dados'], ['Compliance', 'Conformidade com a OAB'], ['Security', 'Segurança e permissões'], ['KPI', 'Indicadores'], ['Process', 'Otimização de processos']] },
    { n: '09', sigla: 'COMPLEXOS', nome: 'Casos Complexos (nome a definir)', diretor: 'aureo', agentes: [], fase: 2,
      missao: 'Conduzir os casos extensos e de alto valor do Dr. Adonias, em especial os processos cíveis em fase recursal em São Paulo, sempre com minutas para a revisão dele. Trabalha junto com o Harvey e o Louis.',
      skills: [['Case Analyst', 'Leitura integral de autos extensos'], ['Fact Mapper', 'Cronologia e fatos'], ['Evidence', 'Análise documental e probatória'], ['Legal Research', 'Pesquisa com fontes verificáveis, junto com a Jessica'], ['Appeals', 'Recursos ao TJSP e aos tribunais superiores']] },
  ],
};
if (typeof window !== 'undefined') window.ESTRUTURA = ESTRUTURA;
