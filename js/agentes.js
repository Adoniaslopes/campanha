'use strict';

/* =====================================================================
 * Aba "Agentes": conversa com os agentes do escritório dentro do CRM.
 * Cada agente segue as regras da sua skill (agentes/<pasta>/SKILL.md e
 * references/*.md, publicadas junto com a página) e lê/grava no CRM pelas
 * ferramentas da página. Funciona quando o CRM roda no claude.ai
 * (capacidade "sample"); fora dele a aba explica onde usar.
 * ===================================================================== */

// As mesmas cinco diretorias do organograma do escritório, com o gerente e a equipe de cada uma (fotos em img/equipe/<id>.jpg).
const EQUIPE_CRM = {
  claude: 'HARVEY', lara: 'DONNA', plinio: 'RACHEL', rui: 'LOUIS', guido: 'ALEX', aureo: 'MIKE', tessa: 'JESSICA', iris: 'SAMANTHA',
  katrina: 'KATRINA', tara: 'TARA', trevor: 'TREVOR', brian: 'BRIAN', jenny: 'JENNY', gretchen: 'GRETCHEN', harold: 'HAROLD', faye: 'FAYE', benjamin: 'BENJAMIN',
};
const AGENTES = [
  {
    id: 'marketing', pasta: 'marketing-escritorio', nome: 'Marketing', sigla: '1 · MARKETING', icone: '📣', resp: 'katrina', time: ['tara', 'trevor', 'brian', 'jenny'],
    desc: 'Equipe do CRM que reporta à Donna. Katrina coordena; Tara faz os criativos, Trevor o roteiro e a copy, Brian o tráfego no Meta e no Google e Jenny as redes sociais. Tudo dentro das regras da OAB.',
    papeis: 'KATRINA = coordenadora de marketing (reporta à DONNA), planeja as campanhas e mede de onde vêm os clientes; TARA = criativos (artes, carrosséis, vídeos curtos); TREVOR = roteiros e copy de alta conversão; BRIAN = gestor de tráfego (Meta Ads e Google Ads, orçamento e custo por lead); JENNY = redes sociais e calendário editorial',
    refs: ['crm.md', 'checklist-oab.md'],
    sugestoes: ['Katrina, de onde estão vindo os leads?', 'Trevor, escreva o anúncio de busca e apreensão', 'Jenny, monte o calendário de posts da semana'],
  },
  {
    id: 'atendimento', pasta: 'atendimento-escritorio', nome: 'Comercial: atendimento e qualificação', sigla: '2 · COMERCIAL', icone: '💬', resp: 'lara', time: ['plinio'],
    desc: 'Donna atende pelo WhatsApp, qualifica os leads e separa quem quer contratar de quem só quer tirar dúvida. Ela também cobra a equipe de Marketing.',
    papeis: 'DONNA = gerente comercial e de marketing, atendimento e qualificação, distribui e cobra as tarefas da equipe de marketing; RACHEL = fechamento (contrato, procuração e agendamento da call)',
    refs: ['crm.md', 'mensagens.md', 'whatsapp-meta.md'],
    sugestoes: ['Quem preciso retornar hoje?', 'Chegou um lead pelo WhatsApp: ', 'Me dá o texto para colar no agente do WhatsApp'],
  },
  {
    id: 'onboarding', pasta: 'onboarding-escritorio', nome: 'Comercial: fechamento e entrada do cliente', sigla: '2 · COMERCIAL', icone: '📝', resp: 'plinio',
    desc: 'Rachel fecha a contratação: contrato e procuração assinados, cadastro, documentos e agendamento da call com o advogado.',
    refs: ['crm.md'],
    sugestoes: ['Fechei com um cliente novo: ', 'Que documentos peço para uma reclamação trabalhista?', 'Agende a call com o advogado para '],
  },
  {
    id: 'contencioso', pasta: 'contencioso-escritorio', nome: 'Departamento Jurídico', sigla: '3 · JURÍDICO', icone: '⚖️', resp: 'tessa', time: ['rui', 'aureo', 'gretchen'],
    desc: 'Jessica dirige, cria teses e aconselha nos casos; Louis conduz os casos complexos, Mike os trabalhistas e Gretchen informa o cliente sobre o processo.',
    papeis: 'JESSICA = diretora do Jurídico, teses, aconselhamento e jurisprudência; LOUIS = casos complexos de Atibaia/TJSP/STJ; MIKE = processos trabalhistas; GRETCHEN = atendimento ao cliente sobre o andamento do processo',
    refs: ['crm.md', 'prazos-jt.md', 'manual-leitura.md'],
    sugestoes: ['Jessica, que tese cabe neste caso? ', 'Louis, qual a situação de Atibaia?', 'Gretchen, o que digo ao cliente sobre o processo '],
  },
  {
    id: 'prazos', pasta: 'contencioso-escritorio', nome: 'Jurídico: protocolo e prazos', sigla: '3 · JURÍDICO', icone: '📅', resp: 'guido',
    desc: 'Alex controla os prazos, as publicações e as intimações de todos os processos, com conferência dupla, e prepara os protocolos.',
    refs: ['crm.md', 'prazos-jt.md', 'manual-leitura.md'],
    sugestoes: ['O que vence nos próximos 10 dias?', 'Quais prazos estão sem confirmação no tribunal?', 'Cadastre uma audiência no processo '],
  },
  {
    id: 'financeiro', pasta: 'financeiro-escritorio', nome: 'Financeiro e administrativo', sigla: '4 · FINANCEIRO', icone: '💰', resp: 'iris', time: ['harold'],
    desc: 'Samantha cuida de honorários, adimplência e cobrança; Harold das guias, custas, taxas e rotinas administrativas.',
    papeis: 'SAMANTHA = diretora financeira, honorários, parcelas e cobrança; HAROLD = guias, custas, taxas e rotinas administrativas',
    refs: ['crm.md', 'mensagens-cobranca.md'],
    sugestoes: ['Quem está em atraso?', 'Faça o fechamento do mês', 'Harold, quais guias estão pendentes?'],
  },
  {
    id: 'compliance', pasta: 'compliance-escritorio', nome: 'Compliance e TI', sigla: '5 · COMPLIANCE E TI', icone: '🛡️', resp: 'faye', time: ['benjamin'],
    desc: 'Equipe do CRM que reporta ao Harvey. Faye audita o CRM e as entregas, cuida da LGPD e das regras da OAB; Benjamin cuida dos sistemas, integrações e segurança.',
    papeis: 'FAYE = compliance (reporta ao HARVEY), qualidade, LGPD e ética OAB; BENJAMIN = Departamento de TI, sistemas, integrações e segurança dos dados',
    refs: ['crm.md'],
    sugestoes: ['Faye, faça uma auditoria do CRM', 'Há prazos em risco?', 'Benjamin, o que falta para ligar o WhatsApp?'],
  },
];
const fotoEquipe = (id, cls = '') => `<img class="foto-equipe ${cls}" src="img/equipe/${id}.jpg" alt="${esc(EQUIPE_CRM[id] || '')}" loading="lazy">`;
const agentePorId = (id) => AGENTES.find((a) => a.id === id);

// ===== Estado das conversas (só neste aparelho) =====
const CHAVE_CHAT = 'crm-juridico-chats-v1';
const chats = (() => { try { return JSON.parse(localStorage.getItem(CHAVE_CHAT)) || {}; } catch { return {}; } })();
const guardarChats = () => { try { localStorage.setItem(CHAVE_CHAT, JSON.stringify(chats)); } catch { /* sem armazenamento */ } };
const rascunhos = {};
const emAndamento = {}; // id do agente → AbortController da resposta em curso
const regrasCache = {};

async function regrasDoAgente(ag) {
  if (regrasCache[ag.id]) return regrasCache[ag.id];
  const ler = async (caminho) => {
    const r = await fetch(caminho);
    if (!r.ok) throw new Error(`não encontrei ${caminho}`);
    return r.text();
  };
  const skill = (await ler(`agentes/${ag.pasta}/SKILL.md`)).replace(/^---[\s\S]*?---\s*/, '');
  const refs = await Promise.all(ag.refs.map(async (f) => `--- references/${f} ---\n${await ler(`agentes/${ag.pasta}/references/${f}`)}`));
  return (regrasCache[ag.id] = `${skill}\n\n${refs.join('\n\n')}`);
}

function instrucoes(ag, regras, comFerramentas) {
  const agora = new Date();
  const resp = EQUIPE_CRM[ag.resp];
  const time = (ag.time || []).map((t) => EQUIPE_CRM[t]).join(', ');
  return `Você é ${resp}, responsável pela área ${ag.sigla} — ${ag.nome} do escritório Lopes Araújo Advocacia${time ? `, junto com ${time}: quando o Dr. chamar um deles pelo nome, responda como essa pessoa (${ag.papeis})` : ''}. Você está conversando com o Dr. Adonias dentro do CRM Jurídico (aberto no claude.ai). Hoje é ${fmtData(hoje())} (${DIAS_SEMANA[agora.getDay()]}).

COMO TRABALHAR NESTE CHAT
- Siga as regras da sua skill, abaixo.
- ${comFerramentas
    ? 'Para ler e gravar no CRM use SOMENTE as ferramentas desta página: listar_registros e salvar_registro. A ferramenta ArtifactData citada nas referências NÃO existe aqui; as coleções têm os nomes curtos clientes, processos, eventos, leads e honorarios, com os mesmos campos descritos na referência do CRM, e tarefas (tarefas da equipe: titulo, responsavel = código do membro, solicitante, status a_fazer | fazendo | aguardando_dr | bloqueada | concluida, prioridade normal | alta, prazo AAAA-MM-DD, descricao, resultado, concluidoEm). Quando o Dr. pedir um trabalho para alguém da equipe, registre a tarefa com o responsável certo. Códigos: claude = Harvey, lara = Donna, plinio = Rachel, tessa = Jessica, rui = Louis, aureo = Mike, guido = Alex, iris = Samantha, katrina, tara, trevor, brian, jenny, gretchen, harold, faye, benjamin.'
    : 'Neste aparelho você não consegue gravar no CRM. Os dados atuais do CRM estão no fim destas instruções; quando algo precisar ser gravado, entregue os campos prontos e diga que não gravou.'}
- Grave no CRM quando o Dr. Adonias pedir ou quando a skill mandar registrar o atendimento. Nunca apague registros. Ao gravar, diga em uma linha o que gravou.
- Ferramentas externas citadas na skill (Gmail, TribuJus, Meta Ads, Google Agenda, Canva, outras skills) NÃO estão disponíveis aqui. Faça o que dá com o CRM e, para a parte externa, diga que isso é feito pedindo ao Claude numa conversa normal.
- Responda em português, de forma curta e organizada para ler no celular: frases curtas, listas simples, sem tabelas largas. Mensagens prontas para enviar vão entre aspas, separadas do resto.

=== REGRAS DA ÁREA ${ag.nome.toUpperCase()} ===
${regras}`;
}

// ===== Ferramentas da página que o agente pode usar =====
function ferramentasDoCRM() {
  return [
    {
      name: 'listar_registros',
      description: 'Lê registros do CRM. Retorna a lista de documentos (JSON) da coleção pedida. Use "busca" para filtrar por um texto (nome, telefone, número do processo) e "ids" para buscar registros específicos.',
      inputSchema: {
        type: 'object',
        properties: {
          colecao: { type: 'string', enum: COLECOES, description: 'clientes, processos, eventos, leads, honorarios ou tarefas' },
          busca: { type: 'string', description: 'Texto opcional para filtrar' },
          ids: { type: 'array', items: { type: 'string' }, description: 'Ids opcionais' },
        },
        required: ['colecao'],
      },
      execute: (entrada) => {
        const col = String(entrada.colecao);
        if (!COLECOES.includes(col)) throw new Error('coleção inválida: use ' + COLECOES.join(', '));
        let itens = db[col];
        if (Array.isArray(entrada.ids) && entrada.ids.length) { const ids = new Set(entrada.ids.map(String)); itens = itens.filter((o) => ids.has(o.id)); }
        if (entrada.busca) itens = itens.filter((o) => contem(String(entrada.busca), JSON.stringify(o), soDigitos(JSON.stringify(o))));
        let json = JSON.stringify(itens);
        if (json.length > 30000) {
          const parte = [];
          for (const o of itens) { if (JSON.stringify(parte).length > 28000) break; parte.push(o); }
          return { total: itens.length, mostrados: parte.length, aviso: 'Lista grande: use "busca" para filtrar.', registros: parte };
        }
        return { total: itens.length, registros: itens };
      },
    },
    {
      name: 'salvar_registro',
      description: 'Cria ou atualiza um registro no CRM. Com "id" de um registro existente, mescla os campos enviados (mantém os outros); sem "id", cria um novo. Listas (andamentos, parcelas, atendimentos) são substituídas inteiras: envie a lista completa. Retorna o registro salvo.',
      inputSchema: {
        type: 'object',
        properties: {
          colecao: { type: 'string', enum: COLECOES },
          registro: { type: 'object', description: 'Campos do registro, conforme a referência do CRM' },
        },
        required: ['colecao', 'registro'],
      },
      execute: (entrada) => {
        const col = String(entrada.colecao);
        if (!COLECOES.includes(col)) throw new Error('coleção inválida: use ' + COLECOES.join(', '));
        const reg = entrada.registro && typeof entrada.registro === 'object' ? JSON.parse(JSON.stringify(entrada.registro)) : null;
        if (!reg) throw new Error('registro ausente');
        delete reg.criadoEm;
        const salvo = gravar(col, reg);
        toast('CRM atualizado pelo agente');
        return salvo;
      },
    },
  ];
}

// ===== Texto das respostas (markdown simples, seguro) =====
function formatarResposta(texto) {
  const linhas = esc(texto).split('\n');
  let html = '';
  let lista = null;
  const inline = (s) => s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
  for (const l of linhas) {
    const item = l.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)$/);
    if (item) {
      const tipo = /^\s*\d/.test(l) ? 'ol' : 'ul';
      if (lista !== tipo) { if (lista) html += `</${lista}>`; html += `<${tipo}>`; lista = tipo; }
      html += `<li>${inline(item[1])}</li>`;
      continue;
    }
    if (lista) { html += `</${lista}>`; lista = null; }
    const titulo = l.match(/^#{1,4}\s+(.*)$/);
    if (titulo) html += `<p><strong>${inline(titulo[1])}</strong></p>`;
    else if (l.trim()) html += `<p>${inline(l)}</p>`;
  }
  if (lista) html += `</${lista}>`;
  return html;
}

function bolhaHTML(m, i) {
  if (m.role === 'user') return `<div class="msg eu">${esc(m.content).replace(/\n/g, '<br>')}</div>`;
  return `<div class="msg ia${m.erro ? ' erro' : ''}" data-i="${i}">
    <div class="msg-texto">${m.content ? formatarResposta(m.content) : '<p class="muted">Pensando…</p>'}</div>
    ${m.content && !m.erro ? `<button class="btn-link msg-copiar" data-acao="copiarResposta" data-i="${i}">copiar</button>` : ''}
  </div>`;
}

// ===== Telas =====
function telaAgentes() {
  return {
    titulo: 'Agentes',
    acoes: '',
    html: `${EM_ARTIFACT ? '' : '<div class="aviso info"><span>Os agentes funcionam quando o CRM está aberto no claude.ai.</span></div>'}
      <p class="muted" style="margin-top:0">Toque em um agente para conversar. Eles seguem as regras do escritório e trabalham direto nos dados deste CRM.</p>
      <div class="agentes">${AGENTES.map((a) => `
        <a class="agente-card" href="#/agente/${a.id}">
          ${fotoEquipe(a.resp)}
          <span><span class="agente-sigla">${esc(a.sigla)} ${a.icone}</span><strong>${esc(a.nome)}</strong>
            <span class="agente-resp">${esc(EQUIPE_CRM[a.resp])}${a.time ? ' · com ' + a.time.map((t) => EQUIPE_CRM[t]).join(', ') : ''}</span>
            ${a.time ? `<span class="agente-time">${a.time.map((t) => fotoEquipe(t, 'mini')).join('')}</span>` : ''}
            <span class="sub">${esc(a.desc)}</span></span>
        </a>`).join('')}</div>`,
  };
}

function telaAgente(id) {
  const ag = agentePorId(id);
  if (!ag) return telaNaoEncontrado();
  const msgs = chats[id] || [];
  return {
    titulo: `${ag.nome}`,
    acoes: msgs.length ? btn('Nova conversa', 'novaConversa', `data-id="${id}"`, '') : '',
    html: `<a class="voltar" href="#/agentes">← Agentes</a>
      <div class="chat">
        <div id="chat-msgs" class="chat-msgs">
          ${msgs.length ? msgs.map(bolhaHTML).join('') : `<div class="chat-vazio">
            <div class="agente-fotos">${fotoEquipe(ag.resp, 'grande')}${(ag.time || []).map((t) => fotoEquipe(t, 'grande')).join('')}</div>
            <p><strong>${esc(ag.nome)}</strong><br><span class="muted">${esc(EQUIPE_CRM[ag.resp])}${ag.time ? ', ' + ag.time.map((t) => EQUIPE_CRM[t]).join(', ') : ''} — ${esc(ag.desc)}</span></p>
            <div class="sugestoes">${ag.sugestoes.map((s) => `<button class="chip" data-acao="sugestaoAgente" data-texto="${esc(s)}">${esc(s.trim())}</button>`).join('')}</div>
          </div>`}
        </div>
        <form id="chat-form" class="chat-entrada">
          <textarea id="chat-texto" rows="2" placeholder="Escreva para o agente…">${esc(rascunhos[id] || '')}</textarea>
          ${emAndamento[id]
            ? '<button type="button" class="btn" data-acao="pararAgente" data-id="' + id + '">Parar</button>'
            : '<button type="submit" class="btn primario">Enviar</button>'}
        </form>
      </div>`,
    depois: () => {
      const caixa = $('#chat-texto');
      const lista = $('#chat-msgs');
      lista.scrollTop = lista.scrollHeight;
      caixa.addEventListener('input', () => { rascunhos[id] = caixa.value; });
      caixa.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); $('#chat-form').requestSubmit(); } });
      $('#chat-form').addEventListener('submit', (e) => { e.preventDefault(); enviarAoAgente(id, caixa.value); });
    },
  };
}

const naTelaDoAgente = (id) => rotaAtual() === `#/agente/${id}`;
function atualizarBolha(id, i) {
  if (!naTelaDoAgente(id)) return;
  const el = document.querySelector(`#chat-msgs [data-i="${i}"]`);
  if (!el) return;
  el.outerHTML = bolhaHTML(chats[id][i], i);
  const lista = $('#chat-msgs');
  lista.scrollTop = lista.scrollHeight;
}

async function enviarAoAgente(id, texto) {
  texto = String(texto || '').trim();
  if (!texto || emAndamento[id]) return;
  const ag = agentePorId(id);
  const sample = EM_ARTIFACT ? await window.claude.use('sample') : null;
  if (!sample) { toast('Os agentes só funcionam com o CRM aberto no claude.ai', 'erro'); return; }

  chats[id] = chats[id] || [];
  chats[id].push({ role: 'user', content: texto });
  chats[id].push({ role: 'assistant', content: '' });
  const i = chats[id].length - 1;
  rascunhos[id] = '';
  const ctl = new AbortController();
  emAndamento[id] = ctl;
  guardarChats();
  if (naTelaDoAgente(id)) render();

  try {
    const regras = await regrasDoAgente(ag);
    const limites = await sample.limits().catch(() => null);
    const comFerramentas = Boolean(limites?.tools);
    let base = instrucoes(ag, regras, comFerramentas);
    if (!comFerramentas) base += `\n\n=== DADOS ATUAIS DO CRM (JSON) ===\n${JSON.stringify(Object.fromEntries(COLECOES.map((c) => [c, db[c]]))).slice(0, 120000)}`;
    // Mantém as últimas 20 mensagens; a primeira mensagem é sempre a das instruções.
    const historico = chats[id].slice(0, -1).filter((m) => m.content && !m.erro).slice(-20);
    while (historico.length && historico[0].role !== 'user') historico.shift();
    const { text, truncated } = await sample([{ role: 'user', content: base }, ...historico], {
      cache: false,
      signal: ctl.signal,
      tools: comFerramentas ? ferramentasDoCRM() : undefined,
      onText: ({ text: parcial }) => { chats[id][i].content = parcial; atualizarBolha(id, i); },
    });
    chats[id][i].content = text + (truncated ? '\n\n(Resposta cortada pelo limite de tamanho. Peça a continuação.)' : '');
  } catch (e) {
    const avisos = {
      cancelled: 'Resposta interrompida.',
      not_granted: 'Para os agentes funcionarem, permita que esta página use o Claude (toque em Permitir quando o aviso aparecer).',
      rate_limited: 'Muitos pedidos seguidos ou limite de uso atingido. Tente de novo em alguns minutos.',
      sampling_disabled: 'O Claude não está disponível para esta conta neste momento.',
      session_expired: 'Sua sessão expirou. Entre de novo no Claude.',
    };
    const parcial = e?.code === 'refused' ? '' : (e?.text || '');
    chats[id][i].content = (parcial ? parcial + '\n\n' : '') + (avisos[e?.code] || `Não consegui responder agora (${e?.code || e?.message || e}). Tente de novo.`);
    chats[id][i].erro = !parcial && e?.code !== 'cancelled';
  } finally {
    delete emAndamento[id];
    guardarChats();
    if (naTelaDoAgente(id)) render();
  }
}

// ===== Rotas e ações =====
ROTAS.agentes = telaAgentes;
ROTAS.agente = telaAgente;
MENU_DE.agente = 'agentes';
Object.assign(acoes, {
  sugestaoAgente: (d) => {
    const caixa = $('#chat-texto');
    if (!caixa) return;
    caixa.value = d.texto;
    caixa.focus();
    caixa.setSelectionRange(caixa.value.length, caixa.value.length);
    const id = rotaAtual().split('/')[2];
    rascunhos[id] = caixa.value;
  },
  pararAgente: (d) => emAndamento[d.id]?.abort(),
  novaConversa: async (d) => {
    if (!await confirmar('Começar uma nova conversa com este agente? A conversa atual sai da tela (os dados do CRM continuam).', { ok: 'Nova conversa' })) return;
    emAndamento[d.id]?.abort();
    chats[d.id] = [];
    guardarChats();
    render();
  },
  copiarResposta: (d) => {
    const id = rotaAtual().split('/')[2];
    const m = chats[id]?.[Number(d.i)];
    if (m) navigator.clipboard?.writeText(m.content).then(() => toast('Copiado'), () => toast('Não foi possível copiar', 'erro'));
  },
});
render();
