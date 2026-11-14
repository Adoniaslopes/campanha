'use strict';

/* =====================================================================
 * Aba "Equipe e tarefas": a equipe completa do escritório, no mesmo
 * desenho do organograma (Controller e cinco diretorias), e o
 * acompanhamento das tarefas de cada um: em aberto, atrasadas,
 * concluídas e no prazo. As tarefas ficam na coleção "tarefas" do CRM
 * (crm/escritorio/tarefas); os turnos automáticos gravam nela também.
 * Fotos em img/equipe/<id>.jpg (só no artifact privado).
 * ===================================================================== */

// Duas equipes (definido pelo Dr. Adonias em 14/11/2026): os 8 gerentes do escritório e a equipe de execução do CRM,
// em que cada um se reporta a um gerente (reportaA), que distribui, acompanha e cobra.
const ORG_CRM = {
  controller: { id: 'claude', nome: 'Harvey', cargo: 'Controller do escritório' },
  gerentes: [
    { id: 'lara', nome: 'Donna', cargo: 'Gerente comercial e de marketing' },
    { id: 'plinio', nome: 'Rachel', cargo: 'Fechamento: contrato, procuração e call' },
    { id: 'tessa', nome: 'Jessica', cargo: 'Diretora jurídica' },
    { id: 'rui', nome: 'Louis', cargo: 'Casos complexos' },
    { id: 'aureo', nome: 'Mike', cargo: 'Trabalhista' },
    { id: 'guido', nome: 'Alex', cargo: 'Protocolo e prazos' },
    { id: 'iris', nome: 'Samantha', cargo: 'Diretora financeira' },
  ],
  diretorias: [
    { id: 'marketing', nome: 'Marketing', reportaA: 'lara', equipe: [
      { id: 'katrina', nome: 'Katrina Bennett', cargo: 'Coordenadora de Marketing' },
      { id: 'tara', nome: 'Tara Messer', cargo: 'Criativos' },
      { id: 'trevor', nome: 'Trevor Evans', cargo: 'Roteiro e copy' },
      { id: 'brian', nome: 'Brian Altman', cargo: 'Gestor de tráfego' },
      { id: 'jenny', nome: 'Jenny Griffith', cargo: 'Redes sociais' },
    ] },
    { id: 'juridico', nome: 'Jurídico', reportaA: 'tessa', equipe: [
      { id: 'gretchen', nome: 'Gretchen Bodinski', cargo: 'Atendimento sobre o processo' },
    ] },
    { id: 'financeiro', nome: 'Financeiro', reportaA: 'iris', equipe: [
      { id: 'harold', nome: 'Harold Gunderson', cargo: 'Guias, custas e administrativo' },
    ] },
    { id: 'compliance', nome: 'Compliance e TI', reportaA: 'claude', equipe: [
      { id: 'faye', nome: 'Faye Richardson', cargo: 'Compliance: qualidade, LGPD e ética OAB' },
      { id: 'benjamin', nome: 'Benjamin', cargo: 'TI: sistemas, integrações e segurança' },
    ] },
  ],
};
const MEMBROS = [
  { ...ORG_CRM.controller, gerente: true, diretoria: 'Gerentes do escritório' },
  ...ORG_CRM.gerentes.map((m) => ({ ...m, gerente: true, diretoria: 'Gerentes do escritório' })),
  ...ORG_CRM.diretorias.flatMap((d) => d.equipe.map((m) => ({ ...m, diretoria: `Equipe do CRM · ${d.nome}`, reportaA: d.reportaA }))),
];
const membro = (id) => MEMBROS.find((m) => m.id === id);
const nomeMembro = (id) => (id === 'dr' ? 'Dr. Adonias' : membro(id)?.nome || id || '—');
const fotoMembro = (id, cls = '') => {
  const m = membro(id);
  const ini = esc((m?.nome || '?').split(/\s+/).map((x) => x[0]).slice(0, 2).join(''));
  return `<span class="foto-membro-crm ${cls}"><span>${ini}</span><img src="img/equipe/${esc(id)}.jpg" alt="" loading="lazy" onerror="this.remove()"></span>`;
};

const STATUS_TAREFA = [
  { v: 'a_fazer', l: 'A fazer', c: 'info' },
  { v: 'fazendo', l: 'Fazendo', c: 'alerta' },
  { v: 'aguardando_dr', l: 'Aguardando o Dr.', c: 'perigo' },
  { v: 'bloqueada', l: 'Bloqueada', c: 'perigo' },
  { v: 'concluida', l: 'Concluída', c: 'sucesso' },
];
const statusTarefa = (v) => STATUS_TAREFA.find((s) => s.v === v) || { l: v || '—', c: '' };
const tarefaAberta = (t) => t.status !== 'concluida';
const tarefaAtrasada = (t) => tarefaAberta(t) && t.prazo && diasAte(t.prazo) < 0;
const dataConclusao = (t) => (t.concluidoEm || t.atualizadoEm || '').slice(0, 10);
const noPrazo = (t) => t.status === 'concluida' && (!t.prazo || dataConclusao(t) <= t.prazo);

/** Números de desempenho de um membro (ou de todos, sem id). Concluídas: últimos 30 dias. */
function desempenho(id) {
  const ts = (db.tarefas || []).filter((t) => !id || t.responsavel === id);
  const limite = addDias(hoje(), -30);
  const concl = ts.filter((t) => t.status === 'concluida' && dataConclusao(t) >= limite);
  const comPrazo = concl.filter((t) => t.prazo);
  return {
    total: ts.length,
    abertas: ts.filter(tarefaAberta).length,
    atrasadas: ts.filter(tarefaAtrasada).length,
    aguardando: ts.filter((t) => t.status === 'aguardando_dr').length,
    concluidas30: concl.length,
    pctPrazo: comPrazo.length ? Math.round((comPrazo.filter(noPrazo).length / comPrazo.length) * 100) : null,
  };
}

function cartaoMembro(m) {
  const d = desempenho(m.id);
  return `<a class="membro-crm ${m.gerente ? 'gerente' : ''}" href="#/membro/${m.id}">
    ${fotoMembro(m.id)}
    <span class="membro-txt"><strong>${esc(m.nome)}</strong><span class="sub">${esc(m.cargo)}${m.reportaA ? ` · reporta a ${esc(nomeMembro(m.reportaA))}` : ''}</span>
      <span class="membro-nums">
        <span class="etiqueta ${d.abertas ? 'info' : ''}">${d.abertas} em aberto</span>
        ${d.atrasadas ? `<span class="etiqueta perigo">${d.atrasadas} atrasada(s)</span>` : ''}
        ${d.aguardando ? `<span class="etiqueta alerta">${d.aguardando} com o Dr.</span>` : ''}
        <span class="etiqueta sucesso">${d.concluidas30} concluída(s) em 30 dias</span>
        ${d.pctPrazo !== null ? `<span class="etiqueta">${d.pctPrazo}% no prazo</span>` : ''}
      </span></span></a>`;
}

function linhaTarefa(t, { mostrarResp = true } = {}) {
  const s = statusTarefa(t.status);
  const d = t.prazo ? diasAte(t.prazo) : null;
  return `<li class="tarefa-crm ${t.status === 'concluida' ? 'concluida' : ''}" data-acao="editarTarefa" data-id="${esc(t.id)}">
    ${mostrarResp ? fotoMembro(t.responsavel, 'mini') : ''}
    <div class="corpo"><span class="titulo">${esc(t.titulo)}</span>
      <span class="sub">${mostrarResp ? `${esc(nomeMembro(t.responsavel))} · ` : ''}pedida por ${esc(nomeMembro(t.solicitante))}${t.prazo ? ` · prazo ${fmtData(t.prazo)}` : ''}${t.status === 'concluida' && t.concluidoEm ? ` · concluída em ${fmtData(t.concluidoEm)}` : ''}</span></div>
    <div class="quando"><span class="etiqueta ${s.c}">${esc(s.l)}</span>${t.prioridade === 'alta' ? ' <span class="etiqueta alerta">Alta</span>' : ''}
      ${tarefaAberta(t) && d !== null ? `<div><span class="etiqueta ${d < 0 ? 'perigo' : d <= 2 ? 'alerta' : ''}">${rotuloDias(d)}</span></div>` : ''}</div>
  </li>`;
}
const ordenarTarefas = (a, b) => (tarefaAberta(b) - tarefaAberta(a)) || ((a.prazo || '9999').localeCompare(b.prazo || '9999')) || (b.atualizadoEm || b.criadoEm || '').localeCompare(a.atualizadoEm || a.criadoEm || '');

function telaEquipe() {
  const g = desempenho();
  const abertas = (db.tarefas || []).filter(tarefaAberta).sort(ordenarTarefas);
  return {
    titulo: 'Equipe e tarefas',
    acoes: btn('+ Nova tarefa', 'novaTarefa'),
    html: `<div class="kpis">${kpi('Tarefas em aberto', g.abertas)}${kpi('Atrasadas', g.atrasadas, g.atrasadas ? 'perigo' : '')}${kpi('Aguardando o Dr.', g.aguardando, g.aguardando ? 'alerta' : '')}${kpi('Concluídas em 30 dias', g.concluidas30, 'sucesso', g.pctPrazo === null ? '' : `${g.pctPrazo}% no prazo`)}</div>
      <h2 class="titulo-equipe">Gerentes do escritório</h2>
      <p class="muted lead-equipe">Trabalham direto com o Dr. Adonias e distribuem, acompanham e cobram a equipe do CRM.</p>
      <div class="grade-membros">${[ORG_CRM.controller, ...ORG_CRM.gerentes].map((g) => cartaoMembro({ ...g, gerente: true })).join('')}</div>
      <h2 class="titulo-equipe">Equipe do CRM</h2>
      <p class="muted lead-equipe">Executa as tarefas e se reporta ao gerente indicado.</p>
      ${ORG_CRM.diretorias.map((d) => `<h3 class="secao-equipe">${esc(d.nome)} · reporta a ${esc(nomeMembro(d.reportaA))}</h3>
        <div class="grade-membros">${d.equipe.map((m) => cartaoMembro({ ...m, reportaA: d.reportaA })).join('')}</div>`).join('')}
      <h3 class="secao-equipe">Todas as tarefas em aberto</h3>
      ${abertas.length ? `<ul class="tarefas-crm">${abertas.map((t) => linhaTarefa(t)).join('')}</ul>` : '<p class="vazio">Nenhuma tarefa em aberto.</p>'}`,
  };
}

function telaMembro(id) {
  const m = membro(id);
  if (!m) return telaNaoEncontrado();
  const d = desempenho(id);
  const ts = (db.tarefas || []).filter((t) => t.responsavel === id).sort(ordenarTarefas);
  return {
    titulo: m.nome,
    acoes: btn('+ Nova tarefa', 'novaTarefa', `data-resp="${esc(id)}"`),
    html: `<a class="voltar" href="#/equipe">← Equipe e tarefas</a>
      <div class="membro-topo">${fotoMembro(id, 'grande')}<div><h2>${esc(m.nome)}</h2><p class="muted">${esc(m.cargo)}${m.diretoria ? ` · ${esc(m.diretoria)}` : ''}${m.reportaA ? ` · reporta a ${esc(nomeMembro(m.reportaA))}` : ''}</p></div></div>
      <div class="kpis">${kpi('Em aberto', d.abertas)}${kpi('Atrasadas', d.atrasadas, d.atrasadas ? 'perigo' : '')}${kpi('Concluídas em 30 dias', d.concluidas30, 'sucesso')}${kpi('Concluídas no prazo', d.pctPrazo === null ? '—' : d.pctPrazo + '%')}</div>
      ${ts.length ? `<ul class="tarefas-crm">${ts.map((t) => linhaTarefa(t, { mostrarResp: false })).join('')}</ul>` : '<p class="vazio">Nenhuma tarefa ainda.</p>'}`,
  };
}

const opcoesMembros = () => MEMBROS.map((m) => ({ v: m.id, l: `${m.nome} — ${m.cargo}` }));
const CAMPOS_TAREFA = [
  { nome: 'titulo', rotulo: 'Tarefa', obrig: true, full: true },
  { nome: 'responsavel', rotulo: 'Responsável', tipo: 'select', opcoes: opcoesMembros, obrig: true, full: true },
  { nome: 'status', rotulo: 'Situação', tipo: 'select', opcoes: STATUS_TAREFA.map((s) => ({ v: s.v, l: s.l })), padrao: 'a_fazer' },
  { nome: 'prioridade', rotulo: 'Prioridade', tipo: 'select', opcoes: [{ v: 'normal', l: 'Normal' }, { v: 'alta', l: 'Alta' }], padrao: 'normal' },
  { nome: 'prazo', rotulo: 'Prazo', tipo: 'date' },
  { nome: 'processoId', rotulo: 'Processo', tipo: 'select', opcoes: opcoesProcessos, vazio: 'Nenhum', full: true },
  { nome: 'descricao', rotulo: 'O que fazer', tipo: 'textarea', linhas: 3 },
  { nome: 'resultado', rotulo: 'Resultado / entrega', tipo: 'textarea', linhas: 3 },
];
function formTarefa(id, valores = {}) {
  const atual = id ? buscar('tarefas', id) : null;
  abrirForm({
    titulo: id ? 'Tarefa' : 'Nova tarefa',
    campos: CAMPOS_TAREFA,
    valores: atual || { solicitante: 'dr', ...valores },
    onSalvar: (d) => {
      const agora = new Date().toISOString();
      if (d.status === 'concluida' && atual?.status !== 'concluida') d.concluidoEm = agora;
      if (d.status !== 'concluida') d.concluidoEm = '';
      gravar('tarefas', { ...d, id, ...(id ? {} : { solicitante: 'dr' }) });
      toast('Tarefa salva');
    },
    onExcluir: id ? async () => {
      if (!await confirmar('Excluir esta tarefa?', { ok: 'Excluir', perigo: true })) return false;
      remover('tarefas', id);
      toast('Tarefa excluída');
    } : null,
  });
}

ROTAS.equipe = telaEquipe;
ROTAS.membro = telaMembro;
MENU_DE.membro = 'equipe';
Object.assign(acoes, {
  novaTarefa: (d) => formTarefa(null, d.resp ? { responsavel: d.resp } : {}),
  editarTarefa: (d) => formTarefa(d.id),
});
render();
