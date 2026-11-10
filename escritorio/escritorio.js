'use strict';

/* =====================================================================
 * Escritório Digital Lopes Araújo — a empresa.
 * Sala de reunião (com voz), equipe, quadro de tarefas e mural.
 * Dados da empresa no banco desta página: escritorio/dados/<coleção>.
 * Os clientes, casos e o financeiro ficam no CRM (outra página).
 * ===================================================================== */

const EQUIPE = {
  claude: { area: 'Gerência', missao: 'Coordena o time, acompanha cada funcionário e se reporta ao Dr. Adonias.', jeito: 'objetivo e organizado; conduz a reunião, resume e fecha com o próximo passo', voz: 'rounded', ritmo: 1.0 },
  lara: { area: 'Atendimento', missao: 'Acolhe quem procura o escritório, faz a triagem, reúne os documentos e marca a reunião com o Dr. Adonias.', jeito: 'acolhedora, cordial e organizada; fala do atendimento e dos clientes que chegaram', voz: 'airy', ritmo: 1.05 },
  rui: { area: 'Contencioso', missao: 'Analisa os casos, elabora contrato, procuração e petições, protocola sob supervisão e acompanha os prazos.', jeito: 'formal, preciso e sereno; cita a lei quando ajuda e é cuidadoso com prazos', voz: 'buttery', ritmo: 0.92 },
  aureo: { area: 'Financeiro', missao: 'Cuida das cobranças, dos recebimentos, da inadimplência e do fechamento do mês.', jeito: 'prudente e direto com números; nunca promete dinheiro que não entrou', voz: 'glassy', ritmo: 0.95 },
  tessa: { area: 'Marketing', missao: 'Pesquisa o mundo jurídico e descobre teses e nichos trabalhistas com demanda.', jeito: 'curiosa e analítica; gosta de fundamentos e fontes', voz: 'glassy', ritmo: 1.05 },
  guido: { area: 'Marketing', missao: 'Transforma teses em campanhas, testa com o mínimo e mede o que traz cliente.', jeito: 'direto, fala de testes, números e próximos passos', voz: 'rounded', ritmo: 1.12 },
  plinio: { area: 'Marketing', missao: 'Escreve os textos dos anúncios e dos posts, dentro das regras da OAB.', jeito: 'eloquente, gosta das palavras certas, mas fala simples', voz: 'buttery', ritmo: 1.05 },
  iris: { area: 'Marketing', missao: 'Cria a identidade visual do escritório, as artes e os vídeos das campanhas.', jeito: 'entusiasmada e visual; pensa em cores, formas e imagens', voz: 'airy', ritmo: 1.15 },
};
const ORDEM = ['claude', 'lara', 'rui', 'aureo', 'tessa', 'guido', 'plinio', 'iris'];
const STATUS_TAREFA = {
  a_fazer: ['A fazer', 'info'],
  fazendo: ['Fazendo', 'alerta'],
  aguardando_dr: ['Aguardando o Dr.', 'perigo'],
  concluida: ['Concluída', 'ok'],
  bloqueada: ['Bloqueada', 'perigo'],
};
const nomeDe = (id) => (id === 'dr' ? 'Dr. Adonias' : TIME[id]?.nome || id);

// ===== Utilidades =====
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = (p = '') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const agoraISO = () => new Date().toISOString();
function quando(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const dias = Math.floor((Date.now() - d) / 864e5);
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (dias === 0 && new Date().getDate() === d.getDate()) return `hoje, ${hora}`;
  if (dias <= 1) return `ontem, ${hora}`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + `, ${hora}`;
}
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.h);
  toast.h = setTimeout(() => { t.hidden = true; }, 3500);
}

// ===== Estado e banco =====
const estado = { sala: [], tarefas: [], atividades: [], status: {}, carregado: false };
let banco = null;
const EM_CLAUDE = typeof window.claude?.use === 'function';
const colecao = (c) => banco.doc('escritorio/dados').collection(c);

async function salvar(c, obj) {
  const limpo = JSON.parse(JSON.stringify(obj));
  if (!banco) { // sem banco: só nesta tela
    const lista = c === 'equipe' ? null : estado[c];
    if (lista) { const i = lista.findIndex((o) => o.id === limpo.id); if (i >= 0) lista[i] = limpo; else lista.push(limpo); }
    renderTudo();
    return;
  }
  try { await colecao(c).doc(limpo.id).set(limpo); }
  catch (e) { toast('Não foi possível salvar: ' + (e?.message || e?.code || e)); throw e; }
}
async function registrarAtividade(quem, texto, tipo = 'nota') {
  await salvar('atividades', { id: uid('atv'), quem, texto, tipo, criadoEm: agoraISO() }).catch(() => {});
}

async function iniciarBanco() {
  if (!EM_CLAUDE) { renderTudo(); return; }
  banco = await window.claude.use('db');
  if (!banco) { mostrarAvisoGeral('O banco da empresa não está disponível nesta visualização: as conversas não serão guardadas.'); renderTudo(); return; }
  const limite = setTimeout(() => { if (!estado.carregado) mostrarAvisoGeral('O banco ainda não respondeu; mostrando o que já está na tela.'); }, 10000);
  const ok = () => { estado.carregado = true; clearTimeout(limite); };
  colecao('sala').orderBy('criadoEm', 'desc').limit(200).onSnapshot((r) => { estado.sala = r.docs.map((d) => d.data()).reverse(); ok(); renderSala(); }, (e) => console.warn(e));
  colecao('tarefas').onSnapshot((r) => { estado.tarefas = r.docs.map((d) => d.data()); ok(); renderTarefas(); renderEquipe(); }, (e) => console.warn(e));
  colecao('atividades').orderBy('criadoEm', 'desc').limit(150).onSnapshot((r) => { estado.atividades = r.docs.map((d) => d.data()); ok(); renderMural(); }, (e) => console.warn(e));
  colecao('equipe').onSnapshot((r) => { estado.status = Object.fromEntries(r.docs.map((d) => [d.id, d.data()])); ok(); renderEquipe(); renderPresenca(); }, (e) => console.warn(e));
}
function mostrarAvisoGeral(msg) {
  if (document.querySelector('.aviso-geral')) return;
  document.querySelector('main').insertAdjacentHTML('afterbegin', `<div class="aviso aviso-geral" style="margin:12px 16px 0">${esc(msg)}</div>`);
}

// ===== Abas =====
function abrirAba(nome) {
  document.querySelectorAll('.abas button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.aba === nome)));
  document.querySelectorAll('.aba').forEach((s) => s.classList.toggle('ativa', s.id === `aba-${nome}`));
  if (nome === 'sala') rolarConversa();
  try { localStorage.setItem('escritorio-aba', nome); } catch { /* sem armazenamento */ }
}
document.querySelector('.abas').addEventListener('click', (e) => { const b = e.target.closest('button[data-aba]'); if (b) abrirAba(b.dataset.aba); });

// ===== Sala =====
const ativoHoje = (id) => { const s = estado.status[id]; return s?.atualizadoEm && Date.now() - new Date(s.atualizadoEm) < 864e5; };
function renderPresenca() {
  $('#presenca').innerHTML = ORDEM.map((id) => `
    <button class="p" data-chamar="${id}" title="${esc(TIME[id].nome)} — ${esc(TIME[id].cargo)}">
      <span class="ponto ${ativoHoje(id) ? 'ativo' : ''}"></span>${avatarSVG(id, 44)}${esc(TIME[id].nome)}
    </button>`).join('');
}
const SUGESTOES = [
  'Bom dia, equipe! Como estamos hoje?',
  'Claude, me dê o resumo da empresa.',
  'LARA, como está o atendimento?',
  'TESSA, que teses você vai pesquisar primeiro?',
];
function bolha(m) {
  if (m.quem === 'dr') return `<div class="fala dr"><div class="bolha"><div class="quem">Dr. Adonias</div><div class="txt">${esc(m.texto)}</div></div></div>`;
  const cls = m.pensando ? 'pensando' : m.erro ? 'erro' : '';
  return `<div class="fala ${cls}" data-id="${esc(m.id)}">${avatarSVG(m.quem, 34)}<div class="bolha">
    <div class="quem">${esc(nomeDe(m.quem))}${!m.pensando && !m.erro && vozDisponivel ? `<button class="btn-link" data-ouvir="${esc(m.id)}">ouvir</button>` : ''}</div>
    <div class="txt">${esc(m.texto)}</div></div></div>`;
}
let pensandoMsg = null;
function renderSala() {
  const msgs = pensandoMsg ? [...estado.sala, pensandoMsg] : estado.sala;
  $('#conversa').innerHTML = msgs.length ? msgs.map(bolha).join('') : `
    <div class="vazio-sala">
      <div class="equipe-mini">${ORDEM.map((id) => avatarSVG(id, 40)).join('')}</div>
      <p><strong>Sala de reunião</strong><br>Fale com a equipe por texto${dictacao ? ' ou pelo microfone' : ''}. O Claude conduz, e cada funcionário responde quando o assunto é dele${vozDisponivel ? ', em voz alta' : ''}.</p>
      <div class="sugestoes">${SUGESTOES.map((s) => `<button class="chip" data-sugestao="${esc(s)}">${esc(s)}</button>`).join('')}</div>
    </div>`;
  rolarConversa();
}
function rolarConversa() { const c = $('#conversa'); c.scrollTop = c.scrollHeight; }

function estadoDaEmpresa() {
  const status = ORDEM.map((id) => `- ${TIME[id].nome}: ${estado.status[id]?.status ? `${estado.status[id].status} (${quando(estado.status[id].atualizadoEm)})` : 'ainda não registrou nenhum turno de trabalho'}`).join('\n');
  const abertas = estado.tarefas.filter((t) => t.status !== 'concluida').sort((a, b) => (a.criadoEm || '').localeCompare(b.criadoEm || ''));
  const tarefas = abertas.length
    ? abertas.slice(-40).map((t) => `- [${t.id}] ${t.titulo} — de ${nomeDe(t.de)} para ${nomeDe(t.para)} — ${STATUS_TAREFA[t.status]?.[0] || t.status}${t.resultado ? ` — resultado: ${String(t.resultado).slice(0, 200)}` : ''}`).join('\n')
    : '- nenhuma tarefa aberta';
  const concluidas = estado.tarefas.filter((t) => t.status === 'concluida').sort((a, b) => (b.atualizadoEm || '').localeCompare(a.atualizadoEm || '')).slice(0, 10)
    .map((t) => `- ${t.titulo} (${nomeDe(t.para)}, ${quando(t.atualizadoEm)})${t.resultado ? `: ${String(t.resultado).slice(0, 200)}` : ''}`).join('\n') || '- nenhuma ainda';
  const atividades = estado.atividades.slice(0, 20).map((a) => `- ${quando(a.criadoEm)} — ${nomeDe(a.quem)}: ${String(a.texto).slice(0, 220)}`).join('\n') || '- nenhuma ainda';
  return `Situação de cada funcionário:\n${status}\n\nTarefas abertas:\n${tarefas}\n\nÚltimas tarefas concluídas:\n${concluidas}\n\nAtividades recentes:\n${atividades}`;
}

function montarPrompt(fala) {
  const hoje = new Date();
  const time = ORDEM.map((id) => `- ${TIME[id].nome} (código "${id}"), ${TIME[id].cargo} — ${EQUIPE[id].missao} Jeito de falar: ${EQUIPE[id].jeito}.`).join('\n');
  const conversa = estado.sala.slice(-24).map((m) => `${nomeDe(m.quem)}: ${m.texto}`).join('\n') || '(início da reunião)';
  return `Você dá voz ao time do Escritório Digital Lopes Araújo, um escritório de advocacia trabalhista 100% digital do Dr. Adonias Lopes de Araújo (OAB/GO 50.607). Vocês estão numa reunião na sala virtual da empresa. Hoje é ${hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, ${hoje.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.

QUEM ESTÁ NA SALA
- Dr. Adonias: diretor. É ele quem está falando com vocês.
${time}

COMO RESPONDER
- Responda à última fala do Dr. Adonias. O Claude sempre fala: conduz, responde pelo time e fecha com o próximo passo. Chame só os funcionários de quem é o assunto ou que foram chamados pelo nome. Normalmente de 1 a 3 falas; no máximo 5.
- Cada fala na primeira pessoa, no jeito daquele funcionário, com 1 a 3 frases curtas. As falas são ouvidas em voz alta: linguagem falada, sem listas, sem markdown, sem emojis, sem siglas difíceis.
- Use só as informações do ESTADO DA EMPRESA abaixo. Nunca invente cliente, número, prazo, campanha, resultado ou trabalho já feito. Se a informação não está lá, diga com naturalidade que ainda não há registro.
- Os funcionários fazem o trabalho nos seus turnos, sozinhos, e registram tudo; na sala eles conversam e combinam. Quando o Dr. Adonias pedir um trabalho, o Claude usa a ferramenta criar_tarefa para o funcionário certo e diz quem vai fazer. Use decidir_tarefa só quando o Dr. Adonias disser claramente que aprova ou recusa uma tarefa que está aguardando por ele.
- Respeite a ética da advocacia: Código de Ética da OAB e Provimento 205/2021.

ESTADO DA EMPRESA
${estadoDaEmpresa()}

CONVERSA RECENTE NA SALA
${conversa}

ÚLTIMA FALA DO DR. ADONIAS
"${fala}"

Responda só com JSON, no formato {"falas":[{"quem":"claude","texto":"..."}]}, usando os códigos: ${ORDEM.join(', ')}.`;
}

function ferramentasDaSala() {
  return [
    {
      name: 'criar_tarefa',
      description: 'Cria uma tarefa no quadro da empresa para um funcionário. Use quando o Dr. Adonias pedir um trabalho. Retorna a tarefa criada.',
      inputSchema: {
        type: 'object',
        properties: {
          para: { type: 'string', enum: ORDEM.filter((id) => id !== 'claude'), description: 'Código do funcionário que vai fazer' },
          titulo: { type: 'string', description: 'Título curto da tarefa' },
          descricao: { type: 'string', description: 'O que fazer, com o contexto dado pelo Dr. Adonias' },
          prioridade: { type: 'string', enum: ['normal', 'alta'] },
        },
        required: ['para', 'titulo', 'descricao'],
      },
      execute: async (e) => {
        const para = String(e.para);
        if (!EQUIPE[para] || para === 'claude') throw new Error('funcionário inválido');
        const t = { id: uid('tar'), titulo: String(e.titulo).slice(0, 140), descricao: String(e.descricao || '').slice(0, 4000), de: 'claude', para, status: 'a_fazer', prioridade: e.prioridade === 'alta' ? 'alta' : 'normal', origem: 'sala', criadoEm: agoraISO(), atualizadoEm: agoraISO() };
        await salvar('tarefas', t);
        await registrarAtividade('claude', `Passei para ${nomeDe(para)}: ${t.titulo}`, 'tarefa');
        return { id: t.id, para: nomeDe(para), titulo: t.titulo };
      },
    },
    {
      name: 'decidir_tarefa',
      description: 'Registra a decisão do Dr. Adonias numa tarefa que está "Aguardando o Dr.": aprovado ou recusado, com a orientação dele. A tarefa volta para o funcionário.',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string' }, decisao: { type: 'string', enum: ['aprovado', 'recusado'] }, nota: { type: 'string' } },
        required: ['id', 'decisao'],
      },
      execute: async (e) => decidirTarefa(String(e.id), e.decisao === 'recusado' ? 'recusado' : 'aprovado', String(e.nota || '')),
    },
  ];
}

let ocupado = false;
let controleFala = null;
async function enviarNaSala(texto) {
  texto = String(texto || '').trim();
  if (!texto || ocupado) return;
  const sample = EM_CLAUDE ? await window.claude.use('sample') : null;
  ocupado = true;
  $('#btn-enviar').disabled = true;
  $('#texto-sala').value = '';
  ajustarCaixa();
  await salvar('sala', { id: uid('msg'), quem: 'dr', texto, criadoEm: agoraISO() }).catch(() => {});
  if (!sample) {
    toast('A conversa com a equipe funciona com o escritório aberto no claude.ai.');
    ocupado = false; $('#btn-enviar').disabled = false;
    return;
  }
  pensandoMsg = { id: 'pensando', quem: 'claude', texto: 'A equipe está pensando…', pensando: true };
  renderSala();
  controleFala = new AbortController();
  try {
    const limites = await sample.limits().catch(() => null);
    const resposta = await sample.json(montarPrompt(texto), {
      signal: controleFala.signal,
      tools: limites?.tools ? ferramentasDaSala() : undefined,
    });
    const falas = (Array.isArray(resposta?.falas) ? resposta.falas : [])
      .filter((f) => EQUIPE[f?.quem] && typeof f.texto === 'string' && f.texto.trim())
      .slice(0, 6)
      .map((f) => ({ id: uid('msg'), quem: f.quem, texto: f.texto.trim().slice(0, 1500) }));
    if (!falas.length) throw { code: 'vazio' };
    pensandoMsg = null;
    const base = Date.now();
    for (const [i, f] of falas.entries()) await salvar('sala', { ...f, criadoEm: new Date(base + i).toISOString() }).catch(() => {});
    renderSala();
    falar(falas);
  } catch (e) {
    const avisos = {
      not_granted: 'Para a equipe responder, permita que o escritório use o Claude (toque em Permitir quando o aviso aparecer).',
      rate_limited: 'Muitos pedidos seguidos ou limite de uso atingido. Tente de novo em alguns minutos.',
      cancelled: 'Resposta interrompida.',
    };
    pensandoMsg = { id: 'erro', quem: 'claude', texto: avisos[e?.code] || `Não consegui responder agora (${e?.code || e?.message || 'erro'}). Tente de novo.`, erro: true };
    renderSala();
    setTimeout(() => { pensandoMsg = null; renderSala(); }, 8000);
  } finally {
    ocupado = false;
    $('#btn-enviar').disabled = false;
  }
}

// ===== Voz (falar e ouvir) =====
let tts = null;
let dictacao = null;
let vozDisponivel = false;
async function iniciarVoz() {
  if (!EM_CLAUDE) return;
  tts = await window.claude.use('tts');
  vozDisponivel = Boolean(tts);
  $('#opcao-voz').hidden = !vozDisponivel;
  try { $('#chk-voz').checked = localStorage.getItem('escritorio-voz') !== 'nao'; } catch { /* padrão: ligado */ }
  if (tts) {
    tts.onState(({ state, reason }) => {
      $('#btn-parar-voz').hidden = state === 'idle';
      if (state === 'idle') marcarFalando(null);
      if (state === 'idle' && ['not_granted', 'unavailable'].includes(reason)) { vozDisponivel = false; $('#opcao-voz').hidden = true; }
    });
    tts.onLine(({ id }) => marcarFalando(id));
  } else {
    $('#aviso-voz').textContent = 'A voz funciona no Chrome e no aplicativo do Claude para computador.';
  }
  dictacao = await window.claude.use('dictation');
  if (dictacao) {
    $('#btn-mic').hidden = false;
    dictacao.onFinal(({ text }) => {
      const caixa = $('#texto-sala');
      caixa.value = (caixa.value ? caixa.value : text.trimStart()) + (caixa.value ? text : '');
      ajustarCaixa();
    });
    dictacao.onPartial(({ text }) => { $('#texto-sala').placeholder = text || 'Ouvindo…'; });
    dictacao.onState(({ state, reason }) => {
      const btn = $('#btn-mic');
      btn.classList.toggle('ouvindo', state !== 'idle');
      btn.textContent = state === 'idle' ? '🎙' : '■';
      if (state === 'idle') {
        $('#texto-sala').placeholder = 'Fale com a equipe…';
        if (reason === 'stopped' && $('#texto-sala').value.trim()) enviarNaSala($('#texto-sala').value);
        if (reason === 'unavailable') btn.hidden = true;
      }
    });
  }
  renderSala();
}
const idParaQuem = {};
function marcarFalando(idMsg) {
  const quem = idMsg ? idParaQuem[idMsg] : null;
  document.querySelectorAll('.presenca .p').forEach((b) => b.classList.toggle('falando', b.dataset.chamar === quem));
}
function falar(falas) {
  if (!tts || !vozDisponivel || !$('#chk-voz').checked) return;
  const linhas = falas.map((f) => {
    idParaQuem[f.id] = f.quem;
    return { text: f.texto.slice(0, 1990), voice: EQUIPE[f.quem].voz, rate: EQUIPE[f.quem].ritmo, language: 'pt-BR', id: f.id };
  });
  tts.speak(linhas).catch((e) => {
    if (e?.code === 'no_gesture') $('#aviso-voz').textContent = 'Toque em "ouvir" numa fala para ouvir.';
    else if (e?.code === 'rate_limited') $('#aviso-voz').textContent = 'Limite de voz atingido por agora.';
  });
}

// ===== Equipe =====
function renderEquipe() {
  const abertas = (id) => estado.tarefas.filter((t) => t.para === id && t.status !== 'concluida').length;
  $('#aba-equipe').innerHTML = `
    <h2 class="titulo">Equipe</h2>
    <p class="lead">Sete funcionários digitais e o gerente. Cada um trabalha no seu turno e registra o que fez.</p>
    <div class="grade-equipe">${ORDEM.map((id) => {
      const s = estado.status[id];
      const n = abertas(id);
      return `<article class="cartao membro">${avatarSVG(id, 72)}<div>
        <h3>${esc(TIME[id].nome)}</h3>
        <div class="cargo">${esc(TIME[id].cargo)} · ${esc(EQUIPE[id].area)}</div>
        <p class="missao">${esc(EQUIPE[id].missao)}</p>
        <div class="status">${s?.status ? `${esc(s.status)} <span class="muted">· ${esc(quando(s.atualizadoEm))}</span>` : '<span class="muted">Aguardando o primeiro turno de trabalho.</span>'}</div>
        <div class="acoes">${n ? `<span class="etq info">${n} tarefa(s) em aberto</span>` : ''}<button class="btn-link" data-chamar="${id}">Falar na sala</button></div>
      </div></article>`;
    }).join('')}</div>`;
}

// ===== Tarefas =====
function renderTarefas() {
  const colunas = [
    ['a_fazer', 'A fazer', (t) => t.status === 'a_fazer'],
    ['fazendo', 'Fazendo', (t) => t.status === 'fazendo' || t.status === 'bloqueada'],
    ['aguardando_dr', 'Aguardando o Dr.', (t) => t.status === 'aguardando_dr'],
    ['concluida', 'Concluídas (7 dias)', (t) => t.status === 'concluida' && Date.now() - new Date(t.atualizadoEm || t.criadoEm) < 7 * 864e5],
  ];
  $('#aba-tarefas').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap">
      <div><h2 class="titulo">Quadro de tarefas</h2><p class="lead">O trabalho passando de um funcionário para o outro.</p></div>
      <button class="btn primario" id="btn-nova-tarefa">+ Nova tarefa</button>
    </div>
    <div class="quadro">${colunas.map(([, titulo, filtro]) => {
      const itens = estado.tarefas.filter(filtro).sort((a, b) => (b.atualizadoEm || '').localeCompare(a.atualizadoEm || ''));
      return `<div class="coluna"><h3>${titulo}<span class="muted">${itens.length}</span></h3>
        ${itens.length ? itens.map((t) => `<div class="tarefa" data-tarefa="${esc(t.id)}">${avatarSVG(t.para, 34)}<div>
          <div class="t">${esc(t.titulo)}</div>
          <div class="s">${esc(nomeDe(t.de))} → ${esc(nomeDe(t.para))} · ${esc(quando(t.atualizadoEm || t.criadoEm))}</div>
          ${t.status === 'bloqueada' ? '<span class="etq perigo">Bloqueada</span>' : ''}${t.prioridade === 'alta' ? ' <span class="etq alerta">Alta</span>' : ''}
        </div></div>`).join('') : '<div class="vazio">Nada aqui.</div>'}
      </div>`;
    }).join('')}</div>`;
}

async function decidirTarefa(id, decisao, nota) {
  const t = estado.tarefas.find((x) => x.id === id);
  if (!t) throw new Error('tarefa não encontrada');
  if (t.status !== 'aguardando_dr') throw new Error('esta tarefa não está aguardando o Dr. Adonias');
  const nova = { ...t, status: 'a_fazer', decisao, decisaoNota: nota, decididoEm: agoraISO(), atualizadoEm: agoraISO() };
  await salvar('tarefas', nova);
  await registrarAtividade('dr', `${decisao === 'aprovado' ? 'Aprovou' : 'Recusou'}: ${t.titulo}${nota ? ` — ${nota}` : ''}`, 'decisao');
  return { id, decisao };
}

function abrirTarefa(id) {
  const t = estado.tarefas.find((x) => x.id === id);
  if (!t) return;
  const [rotulo, cls] = STATUS_TAREFA[t.status] || [t.status, ''];
  abrirModal(`
    <div class="linha">${avatarSVG(t.para, 44)}<div><h3>${esc(t.titulo)}</h3>
      <div class="muted">${esc(nomeDe(t.de))} → ${esc(nomeDe(t.para))} · criada ${esc(quando(t.criadoEm))}</div></div></div>
    <span class="etq ${cls}">${esc(rotulo)}</span>${t.prioridade === 'alta' ? ' <span class="etq alerta">Prioridade alta</span>' : ''}
    ${t.descricao ? `<pre>${esc(t.descricao)}</pre>` : ''}
    ${t.resultado ? `<strong>Resultado</strong><pre>${esc(t.resultado)}</pre>` : ''}
    ${t.decisao ? `<strong>Decisão do Dr. Adonias</strong><pre>${esc(t.decisao)}${t.decisaoNota ? ` — ${esc(t.decisaoNota)}` : ''}</pre>` : ''}
    ${t.status === 'aguardando_dr' ? `<label><strong>Sua orientação</strong> (opcional)<textarea id="nota-decisao" rows="3"></textarea></label>` : ''}
    <div class="botoes">
      <button class="btn" data-fechar>Fechar</button>
      ${t.status === 'aguardando_dr' ? `<button class="btn perigo" data-decidir="recusado" data-id="${esc(t.id)}">Recusar</button><button class="btn primario" data-decidir="aprovado" data-id="${esc(t.id)}">Aprovar</button>` : ''}
    </div>`);
}

function novaTarefa() {
  abrirModal(`
    <h3>Nova tarefa</h3>
    <form id="form-tarefa">
      <label>Para<br><select name="para" style="width:100%;font:inherit;padding:8px;border-radius:8px;border:1px solid var(--borda);background:var(--superficie);color:var(--texto)">
        ${ORDEM.filter((id) => id !== 'claude').map((id) => `<option value="${id}">${esc(TIME[id].nome)} — ${esc(TIME[id].cargo)}</option>`).join('')}
      </select></label><br><br>
      <label>Título<br><textarea name="titulo" rows="1" required></textarea></label><br><br>
      <label>O que fazer<br><textarea name="descricao" rows="4"></textarea></label>
      <div class="botoes"><button type="button" class="btn" data-fechar>Cancelar</button><button class="btn primario">Criar tarefa</button></div>
    </form>`);
  $('#form-tarefa').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target.elements;
    if (!f.titulo.value.trim()) return;
    const t = { id: uid('tar'), titulo: f.titulo.value.trim(), descricao: f.descricao.value.trim(), de: 'dr', para: f.para.value, status: 'a_fazer', prioridade: 'normal', origem: 'quadro', criadoEm: agoraISO(), atualizadoEm: agoraISO() };
    await salvar('tarefas', t).catch(() => {});
    await registrarAtividade('dr', `Passou para ${nomeDe(t.para)}: ${t.titulo}`, 'tarefa');
    fecharModal();
    toast('Tarefa criada');
  });
}

// ===== Mural =====
function renderMural() {
  $('#aba-mural').innerHTML = `
    <h2 class="titulo">Mural de atividades</h2>
    <p class="lead">Tudo o que a equipe fez, do mais recente para o mais antigo.</p>
    ${estado.atividades.length ? `<ul class="mural">${estado.atividades.map((a) => `
      <li>${a.quem === 'dr' ? avatarSVG('adonias', 38) : avatarSVG(a.quem, 38)}<div>
        <span class="q">${esc(nomeDe(a.quem))}</span> <span class="w">${esc(quando(a.criadoEm))}</span>
        <p>${esc(a.texto)}</p></div></li>`).join('')}</ul>` : '<div class="cartao vazio">Ainda não há atividades. Elas aparecem quando a equipe começa a trabalhar.</div>'}`;
}

// ===== Modal =====
function abrirModal(html) { const m = $('#modal'); m.innerHTML = `<div class="caixa" role="dialog" aria-modal="true">${html}</div>`; m.hidden = false; }
function fecharModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; }
$('#modal').addEventListener('mousedown', (e) => { if (e.target.id === 'modal') fecharModal(); });

// ===== Eventos =====
function ajustarCaixa() { const c = $('#texto-sala'); c.style.height = 'auto'; c.style.height = Math.min(c.scrollHeight, 140) + 'px'; }
$('#texto-sala').addEventListener('input', ajustarCaixa);
$('#texto-sala').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarNaSala(e.target.value); } });
$('#form-sala').addEventListener('submit', (e) => { e.preventDefault(); enviarNaSala($('#texto-sala').value); });
$('#btn-mic').addEventListener('click', () => {
  if (!dictacao) return;
  if (dictacao.active()) { dictacao.stop().catch(() => {}); return; }
  dictacao.start({ language: 'pt-BR' }).catch((e) => {
    if (e?.code === 'not_granted') { toast('Microfone não permitido para o escritório.'); $('#btn-mic').hidden = true; }
    else if (e?.code !== 'dismissed' && e?.code !== 'stopped') toast('Não foi possível usar o microfone agora.');
  });
});
$('#btn-parar-voz').addEventListener('click', () => tts?.stop().catch(() => {}));
$('#chk-voz').addEventListener('change', (e) => {
  try { localStorage.setItem('escritorio-voz', e.target.checked ? 'sim' : 'nao'); } catch { /* ignora */ }
  if (!e.target.checked) tts?.stop().catch(() => {});
});
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-chamar],[data-sugestao],[data-ouvir],[data-tarefa],[data-fechar],[data-decidir],#btn-nova-tarefa');
  if (!el) return;
  if (el.dataset.chamar) {
    abrirAba('sala');
    const caixa = $('#texto-sala');
    caixa.value = `${TIME[el.dataset.chamar].nome}, ${caixa.value}`;
    caixa.focus();
    ajustarCaixa();
  } else if (el.dataset.sugestao) {
    enviarNaSala(el.dataset.sugestao);
  } else if (el.dataset.ouvir) {
    const m = estado.sala.find((x) => x.id === el.dataset.ouvir);
    if (m && tts) { idParaQuem[m.id] = m.quem; tts.speak([{ text: m.texto.slice(0, 1990), voice: EQUIPE[m.quem]?.voz, rate: EQUIPE[m.quem]?.ritmo, language: 'pt-BR', id: m.id }]).catch(() => {}); }
  } else if (el.dataset.tarefa) {
    abrirTarefa(el.dataset.tarefa);
  } else if (el.hasAttribute('data-fechar')) {
    fecharModal();
  } else if (el.dataset.decidir) {
    decidirTarefa(el.dataset.id, el.dataset.decidir, $('#nota-decisao')?.value.trim() || '')
      .then(() => { fecharModal(); toast('Decisão registrada. A tarefa voltou para o funcionário.'); })
      .catch((err) => toast(String(err?.message || err)));
  } else if (el.id === 'btn-nova-tarefa') {
    novaTarefa();
  }
});

// ===== Início =====
function renderTudo() { renderPresenca(); renderSala(); renderEquipe(); renderTarefas(); renderMural(); }
renderTudo();
try { const aba = localStorage.getItem('escritorio-aba'); if (aba) abrirAba(aba); } catch { /* ignora */ }
iniciarBanco();
iniciarVoz();
