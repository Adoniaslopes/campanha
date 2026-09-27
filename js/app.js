'use strict';

/* =====================================================================
 * CRM Jurídico — aplicação de página única, sem servidor.
 * Os dados ficam no localStorage do navegador; use Backup para exportar.
 * ===================================================================== */

// ===== Utilidades =====
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const soDigitos = (s) => String(s ?? '').replace(/\D/g, '');
const normalizar = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const contem = (q, ...campos) => !q || campos.some((c) => normalizar(c).includes(normalizar(q)));
const soma = (arr, fn) => arr.reduce((t, x) => t + (Number(fn(x)) || 0), 0);
const arred = (v) => Math.round((Number(v) || 0) * 100) / 100;

function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const hoje = () => toISO(new Date());
function partes(iso) { return iso.split('-').map(Number); }
function addDias(iso, n) { const [y, m, d] = partes(iso); return toISO(new Date(y, m - 1, d + n)); }
function addMeses(iso, n) {
  const [y, m, d] = partes(iso);
  const ultimo = new Date(y, m - 1 + n + 1, 0).getDate();
  return toISO(new Date(y, m - 1 + n, Math.min(d, ultimo)));
}
function diasAte(iso) {
  if (!iso) return null;
  const [y, m, d] = partes(iso);
  const [ty, tm, td] = partes(hoje());
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(ty, tm - 1, td)) / 864e5);
}
const fmtData = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '');
const fmtMoeda = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
function diaSemana(iso) { const [y, m, d] = partes(iso); return DIAS_SEMANA[new Date(y, m - 1, d).getDay()]; }

function linkWhats(tel) {
  let d = soDigitos(tel);
  if (!d) return '';
  if (d.length <= 11) d = '55' + d;
  return `https://wa.me/${d}`;
}

function baixar(nome, conteudo, tipo) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement('a');
  a.href = url; a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toast(msg, tipo = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + tipo;
  el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ===== Máscaras =====
function aplicarPadrao(digitos, padrao) {
  let out = '', i = 0;
  for (const ch of padrao) {
    if (i >= digitos.length) break;
    out += ch === '#' ? digitos[i++] : ch;
  }
  return out;
}
const MASCARAS = {
  tel: (v) => { const d = soDigitos(v).slice(0, 11); return aplicarPadrao(d, d.length > 10 ? '(##) #####-####' : '(##) ####-####'); },
  doc: (v) => { const d = soDigitos(v).slice(0, 14); return aplicarPadrao(d, d.length > 11 ? '##.###.###/####-##' : '###.###.###-##'); },
  cnj: (v) => aplicarPadrao(soDigitos(v).slice(0, 20), '#######-##.####.#.##.####'),
};

// ===== Prazos processuais (dias úteis, CPC arts. 219, 220 e 224) =====
function pascoa(ano) {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return toISO(new Date(ano, mes - 1, dia));
}
const cacheFeriados = {};
function feriados(ano) {
  if (cacheFeriados[ano]) return cacheFeriados[ano];
  const fixos = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25'].map((md) => `${ano}-${md}`);
  const p = pascoa(ano);
  // Carnaval (segunda e terça), Sexta-feira Santa e Corpus Christi
  const moveis = [-48, -47, -2, 60].map((n) => addDias(p, n));
  return (cacheFeriados[ano] = new Set([...fixos, ...moveis]));
}
const emRecesso = (iso) => { const md = iso.slice(5); return md >= '12-20' || md <= '01-20'; };
function diaUtil(iso) {
  const [y, m, d] = partes(iso);
  const dow = new Date(y, m - 1, d).getDay();
  return dow !== 0 && dow !== 6 && !feriados(y).has(iso) && !emRecesso(iso);
}
function calcularPrazo(inicio, dias, uteis) {
  let d = inicio;
  if (uteis) {
    let n = 0;
    while (n < dias) { d = addDias(d, 1); if (diaUtil(d)) n++; }
  } else {
    d = addDias(inicio, dias);
  }
  while (!diaUtil(d)) d = addDias(d, 1);
  return d;
}

// ===== Constantes de domínio =====
const AREAS = ['Previdenciário', 'Cível', 'Consumidor', 'Trabalhista', 'Família e Sucessões', 'Criminal', 'Tributário', 'Empresarial', 'Administrativo', 'Imobiliário', 'Outro'];
const STATUS_PROC = ['Ativo', 'Aguardando julgamento', 'Em recurso', 'Em execução', 'Suspenso', 'Acordo', 'Encerrado - procedente', 'Encerrado - improcedente', 'Arquivado'];
const ENCERRADOS = new Set(['Acordo', 'Encerrado - procedente', 'Encerrado - improcedente', 'Arquivado']);
const FASES = ['Administrativo', 'Conhecimento', 'Recursal', 'Cumprimento de sentença / Execução'];
const TIPOS_EVENTO = ['Prazo', 'Audiência', 'Perícia', 'Reunião', 'Tarefa'];
const ORIGENS = ['Site', 'Indicação', 'Instagram', 'Facebook', 'Google', 'WhatsApp', 'Campanha', 'Outro'];
const TIPOS_HON = ['Fixo (à vista)', 'Parcelado', 'Êxito', 'Mensal (partido)', 'Consulta'];
const FORMAS_PGTO = ['PIX', 'Transferência', 'Boleto', 'Cartão', 'Dinheiro', 'Alvará judicial', 'Outro'];
const ETAPAS = [
  { id: 'novo', nome: 'Novo contato' },
  { id: 'conversa', nome: 'Em conversa' },
  { id: 'consulta', nome: 'Consulta agendada' },
  { id: 'proposta', nome: 'Proposta enviada' },
  { id: 'fechado', nome: 'Contrato fechado' },
  { id: 'perdido', nome: 'Perdido' },
];
const nomeEtapa = (id) => ETAPAS.find((e) => e.id === id)?.nome || id;
const processoAtivo = (p) => !ENCERRADOS.has(p.status);

// ===== Armazenamento =====
const CHAVE = 'crm-juridico-v1';
const COLECOES = ['clientes', 'processos', 'eventos', 'leads', 'honorarios'];
const vazio = () => ({ clientes: [], processos: [], eventos: [], leads: [], honorarios: [], meta: {} });

function carregar() {
  try {
    const raw = localStorage.getItem(CHAVE);
    if (raw) return { ...vazio(), ...JSON.parse(raw) };
  } catch (e) {
    console.error(e);
    alert('Não foi possível ler os dados salvos. Restaure um backup em "Backup e ajustes".');
  }
  return vazio();
}
let db = carregar();

function salvar() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(db));
  } catch (e) {
    toast('Erro ao salvar: ' + e.message, 'erro');
  }
}
// Pede ao navegador para não apagar os dados automaticamente.
if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});

const buscar = (col, id) => db[col].find((x) => x.id === id);
function gravar(col, obj) {
  const agora = new Date().toISOString();
  const i = obj.id ? db[col].findIndex((x) => x.id === obj.id) : -1;
  if (i >= 0) {
    db[col][i] = { ...db[col][i], ...obj, atualizadoEm: agora };
    salvar();
    return db[col][i];
  }
  const novo = { ...obj, id: obj.id || uid(), criadoEm: agora };
  db[col].push(novo);
  salvar();
  return novo;
}
function remover(col, id) { db[col] = db[col].filter((x) => x.id !== id); salvar(); }

const nomeCliente = (id) => buscar('clientes', id)?.nome || '—';
const opcoesClientes = () => [...db.clientes].sort((a, b) => a.nome.localeCompare(b.nome)).map((c) => ({ v: c.id, l: c.nome }));
const opcoesProcessos = () => db.processos.map((p) => ({ v: p.id, l: `${p.numero || 'Sem número'} — ${nomeCliente(p.clienteId)}` }));
const rotuloProcesso = (p) => p.numero || p.tipoAcao || 'Processo sem número';

// ===== Parcelas / honorários =====
function todasParcelas() {
  return db.honorarios.flatMap((h) => (h.parcelas || []).map((p) => ({ ...p, h, qtd: h.parcelas.length })));
}
function statusParcela(p) {
  if (p.pago) return { t: 'Paga', c: 'sucesso' };
  const d = diasAte(p.vencimento);
  if (d < 0) return { t: `Vencida há ${-d} dia(s)`, c: 'perigo' };
  if (d <= 5) return { t: d === 0 ? 'Vence hoje' : `Vence em ${d} dia(s)`, c: 'alerta' };
  return { t: 'A vencer', c: 'info' };
}
function resumoHonorario(h) {
  const ps = h.parcelas || [];
  const total = soma(ps, (p) => p.valor);
  const recebido = soma(ps.filter((p) => p.pago), (p) => p.valor);
  const vencido = soma(ps.filter((p) => !p.pago && diasAte(p.vencimento) < 0), (p) => p.valor);
  return { total, recebido, saldo: total - recebido, vencido };
}
function gerarParcelas(total, qtd, primeiroVenc) {
  total = arred(total); qtd = Math.max(1, Math.floor(qtd || 1));
  const base = Math.floor((total / qtd) * 100) / 100;
  const parcelas = [];
  for (let i = 0; i < qtd; i++) {
    const valor = i === qtd - 1 ? arred(total - base * (qtd - 1)) : base;
    parcelas.push({ id: uid(), numero: i + 1, vencimento: addMeses(primeiroVenc, i), valor, pago: false, dataPagamento: '', forma: '' });
  }
  return parcelas;
}

// ===== Agenda =====
function urgencia(ev) {
  if (ev.concluido) return '';
  const d = diasAte(ev.data);
  if (d < 0) return 'perigo';
  if (d <= 2) return 'alerta';
  if (d <= 7) return 'info';
  return '';
}
function rotuloDias(d) {
  if (d === null) return '';
  if (d < 0) return `${-d} dia(s) atrasado`;
  if (d === 0) return 'Hoje';
  if (d === 1) return 'Amanhã';
  return `em ${d} dias`;
}
const ordenarEventos = (a, b) => (a.data + (a.hora || '99')).localeCompare(b.data + (b.hora || '99'));

function eventoHTML(ev, { mostrarVinculo = true } = {}) {
  const proc = ev.processoId && buscar('processos', ev.processoId);
  const cliId = ev.clienteId || proc?.clienteId;
  const d = diasAte(ev.data);
  const u = urgencia(ev);
  const vinculo = mostrarVinculo ? [
    proc ? `<a href="#/processo/${proc.id}">${esc(rotuloProcesso(proc))}</a>` : '',
    cliId ? `<a href="#/cliente/${cliId}">${esc(nomeCliente(cliId))}</a>` : '',
  ].filter(Boolean).join(' · ') : '';
  return `<li class="evento ${ev.concluido ? 'concluido' : ''}">
    <input type="checkbox" data-acao="alternarEvento" data-id="${ev.id}" ${ev.concluido ? 'checked' : ''} title="Marcar como concluído">
    <div class="corpo">
      <div><span class="etiqueta ${ev.tipo === 'Prazo' && !ev.concluido ? 'perigo' : ''}">${esc(ev.tipo)}</span> ${ev.prioridade === 'Alta' ? '<span class="etiqueta alerta">Alta</span>' : ''}
      <span class="titulo">${esc(ev.titulo)}</span></div>
      ${vinculo ? `<span class="sub">${vinculo}</span>` : ''}
      ${ev.local ? `<span class="sub">📍 ${esc(ev.local)}</span>` : ''}
    </div>
    <div class="quando">
      <div><strong>${fmtData(ev.data)}</strong> <span class="muted">${diaSemana(ev.data)}</span>${ev.hora ? ` · ${esc(ev.hora)}` : ''}</div>
      ${!ev.concluido ? `<span class="etiqueta ${u}">${rotuloDias(d)}</span>` : ''}
      <div><button class="btn-link" data-acao="editarEvento" data-id="${ev.id}">editar</button></div>
    </div>
  </li>`;
}
function listaEventos(evs, opts) {
  if (!evs.length) return '<p class="vazio">Nada agendado.</p>';
  return `<ul class="eventos">${evs.map((e) => eventoHTML(e, opts)).join('')}</ul>`;
}

// ===== Modal e formulários genéricos =====
function abrirModal(titulo, html) {
  $('#modal-titulo').textContent = titulo;
  $('#modal-corpo').innerHTML = html;
  $('#modal').hidden = false;
  document.body.style.overflow = 'hidden';
}
function fecharModal() {
  $('#modal').hidden = true;
  $('#modal-corpo').innerHTML = '';
  document.body.style.overflow = '';
}

function campoHTML(c, v) {
  if (c.tipo === 'secao') return `<h4 class="full">${esc(c.rotulo)}</h4>`;
  const id = 'f_' + c.nome;
  const req = c.obrig ? 'required' : '';
  v = v ?? c.padrao ?? '';
  if (c.tipo === 'checkbox') {
    return `<label class="campo check ${c.full ? 'full' : ''}"><input type="checkbox" name="${c.nome}" ${v ? 'checked' : ''}> ${esc(c.rotulo)}</label>`;
  }
  let input;
  if (c.tipo === 'textarea') {
    input = `<textarea id="${id}" name="${c.nome}" rows="${c.linhas || 3}" ${req}>${esc(v)}</textarea>`;
  } else if (c.tipo === 'select') {
    const ops = (typeof c.opcoes === 'function' ? c.opcoes() : c.opcoes).map((o) => (typeof o === 'string' ? { v: o, l: o } : o));
    input = `<select id="${id}" name="${c.nome}" ${req}>
      ${c.vazio !== undefined ? `<option value="">${esc(c.vazio)}</option>` : ''}
      ${ops.map((o) => `<option value="${esc(o.v)}" ${String(o.v) === String(v) ? 'selected' : ''}>${esc(o.l)}</option>`).join('')}
    </select>`;
  } else {
    const tipo = c.tipo === 'money' ? 'number' : c.tipo || 'text';
    const extra = c.tipo === 'money' ? 'step="0.01" min="0" inputmode="decimal"' : c.tipo === 'number' ? 'step="any"' : '';
    input = `<input id="${id}" name="${c.nome}" type="${tipo}" value="${esc(v)}" ${extra}
      ${c.mascara ? `data-mascara="${c.mascara}" inputmode="numeric"` : ''} ${c.placeholder ? `placeholder="${esc(c.placeholder)}"` : ''} ${req}>`;
  }
  return `<label class="campo ${c.full || c.tipo === 'textarea' ? 'full' : ''}" for="${id}">
    <span>${esc(c.rotulo)}${c.obrig ? ' *' : ''}</span>${input}${c.dica ? `<small>${esc(c.dica)}</small>` : ''}</label>`;
}

/** Abre um formulário em modal. onSalvar(dados) pode retornar false para manter o modal aberto. */
function abrirForm({ titulo, campos, valores = {}, onSalvar, onExcluir }) {
  abrirModal(titulo, `<form id="form-modal" class="form-grid" novalidate>
    ${campos.map((c) => campoHTML(c, valores[c.nome])).join('')}
    <div class="form-acoes">
      ${onExcluir ? '<button type="button" class="btn perigo" id="form-excluir" style="margin-right:auto">Excluir</button>' : ''}
      <button type="button" class="btn" data-acao="fecharModal">Cancelar</button>
      <button type="submit" class="btn primario">Salvar</button>
    </div>
  </form>`);
  const form = $('#form-modal');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const dados = {};
    for (const c of campos) {
      const el = form.elements[c.nome];
      if (!el || c.tipo === 'secao') continue;
      let v = c.tipo === 'checkbox' ? el.checked : el.value.trim();
      if (c.tipo === 'number' || c.tipo === 'money') v = v === '' ? null : Number(v);
      dados[c.nome] = v;
    }
    if (onSalvar(dados) !== false) { fecharModal(); render(); }
  });
  if (onExcluir) {
    $('#form-excluir').addEventListener('click', () => {
      if (onExcluir() !== false) { fecharModal(); render(); }
    });
  }
  form.querySelector('input:not([type=checkbox]), select, textarea')?.focus();
}

// ===== Formulários das entidades =====
const CAMPOS_CLIENTE = [
  { nome: 'nome', rotulo: 'Nome completo / Razão social', obrig: true, full: true },
  { nome: 'tipo', rotulo: 'Tipo', tipo: 'select', opcoes: [{ v: 'PF', l: 'Pessoa física' }, { v: 'PJ', l: 'Pessoa jurídica' }], padrao: 'PF' },
  { nome: 'documento', rotulo: 'CPF / CNPJ', mascara: 'doc' },
  { nome: 'telefone', rotulo: 'Telefone / WhatsApp', tipo: 'tel', mascara: 'tel' },
  { nome: 'email', rotulo: 'E-mail', tipo: 'email' },
  { nome: 'nascimento', rotulo: 'Data de nascimento', tipo: 'date' },
  { nome: 'profissao', rotulo: 'Profissão' },
  { nome: 'beneficioINSS', rotulo: 'Nº do benefício (INSS)', dica: 'Opcional — útil em causas previdenciárias' },
  { nome: 'origem', rotulo: 'Como chegou ao escritório', tipo: 'select', opcoes: ORIGENS, vazio: '—' },
  { nome: 'endereco', rotulo: 'Endereço', full: true },
  { nome: 'observacoes', rotulo: 'Observações', tipo: 'textarea' },
];

function formCliente(id, valores = {}) {
  const atual = id ? buscar('clientes', id) : valores;
  abrirForm({
    titulo: id ? 'Editar cliente' : 'Novo cliente',
    campos: CAMPOS_CLIENTE,
    valores: atual,
    onSalvar: (d) => {
      const c = gravar('clientes', { ...d, id });
      toast('Cliente salvo');
      if (!id) location.hash = `#/cliente/${c.id}`;
    },
    onExcluir: id ? () => excluirCliente(id) : null,
  });
}

function excluirCliente(id) {
  const procs = db.processos.filter((p) => p.clienteId === id);
  const procIds = new Set(procs.map((p) => p.id));
  const evs = db.eventos.filter((e) => e.clienteId === id || procIds.has(e.processoId));
  const hons = db.honorarios.filter((h) => h.clienteId === id);
  const aviso = procs.length || evs.length || hons.length
    ? `\n\nTambém serão excluídos: ${procs.length} processo(s), ${evs.length} compromisso(s) e ${hons.length} contrato(s) de honorários.`
    : '';
  if (!confirm(`Excluir o cliente "${nomeCliente(id)}"?${aviso}\n\nEsta ação não pode ser desfeita.`)) return false;
  db.processos = db.processos.filter((p) => p.clienteId !== id);
  db.eventos = db.eventos.filter((e) => !evs.includes(e));
  db.honorarios = db.honorarios.filter((h) => h.clienteId !== id);
  db.leads.forEach((l) => { if (l.clienteId === id) l.clienteId = ''; });
  remover('clientes', id);
  toast('Cliente excluído');
  location.hash = '#/clientes';
}

const CAMPOS_PROCESSO = [
  { nome: 'clienteId', rotulo: 'Cliente', tipo: 'select', opcoes: opcoesClientes, obrig: true, vazio: 'Selecione…', full: true },
  { nome: 'numero', rotulo: 'Número do processo (CNJ)', mascara: 'cnj', placeholder: '0000000-00.0000.0.00.0000', dica: 'Deixe em branco se ainda não foi distribuído' },
  { nome: 'area', rotulo: 'Área', tipo: 'select', opcoes: AREAS, padrao: 'Previdenciário' },
  { nome: 'tipoAcao', rotulo: 'Tipo de ação / assunto', placeholder: 'Ex.: Restituição de descontos indevidos' },
  { nome: 'polo', rotulo: 'Cliente é', tipo: 'select', opcoes: ['Autor', 'Réu', 'Requerente', 'Requerido', 'Terceiro'] },
  { nome: 'parteContraria', rotulo: 'Parte contrária' },
  { nome: 'tribunal', rotulo: 'Tribunal / órgão', placeholder: 'Ex.: TRF1, TJMT, INSS' },
  { nome: 'vara', rotulo: 'Vara / juízo' },
  { nome: 'comarca', rotulo: 'Comarca / subseção' },
  { nome: 'status', rotulo: 'Situação', tipo: 'select', opcoes: STATUS_PROC, padrao: 'Ativo' },
  { nome: 'fase', rotulo: 'Fase', tipo: 'select', opcoes: FASES, padrao: 'Conhecimento' },
  { nome: 'valorCausa', rotulo: 'Valor da causa (R$)', tipo: 'money' },
  { nome: 'distribuicao', rotulo: 'Data de distribuição', tipo: 'date' },
  { nome: 'link', rotulo: 'Link de consulta (PJe, e-SAJ…)', tipo: 'url', full: true },
  { nome: 'observacoes', rotulo: 'Observações', tipo: 'textarea' },
];

function formProcesso(id, valores = {}) {
  if (!db.clientes.length) { toast('Cadastre um cliente primeiro'); return formCliente(); }
  abrirForm({
    titulo: id ? 'Editar processo' : 'Novo processo',
    campos: CAMPOS_PROCESSO,
    valores: id ? buscar('processos', id) : valores,
    onSalvar: (d) => {
      const p = gravar('processos', { ...d, id });
      toast('Processo salvo');
      if (!id) location.hash = `#/processo/${p.id}`;
    },
    onExcluir: id ? () => excluirProcesso(id) : null,
  });
}

function excluirProcesso(id) {
  const p = buscar('processos', id);
  const evs = db.eventos.filter((e) => e.processoId === id);
  if (!confirm(`Excluir o processo "${rotuloProcesso(p)}"?${evs.length ? `\n\n${evs.length} compromisso(s) vinculado(s) também serão excluídos.` : ''}`)) return false;
  db.eventos = db.eventos.filter((e) => e.processoId !== id);
  db.honorarios.forEach((h) => { if (h.processoId === id) h.processoId = ''; });
  remover('processos', id);
  toast('Processo excluído');
  location.hash = `#/cliente/${p.clienteId}`;
}

const CAMPOS_EVENTO = [
  { nome: 'tipo', rotulo: 'Tipo', tipo: 'select', opcoes: TIPOS_EVENTO, padrao: 'Prazo' },
  { nome: 'prioridade', rotulo: 'Prioridade', tipo: 'select', opcoes: ['Normal', 'Alta'], padrao: 'Normal' },
  { nome: 'titulo', rotulo: 'Descrição', obrig: true, full: true, placeholder: 'Ex.: Réplica à contestação' },
  { nome: 'data', rotulo: 'Data', tipo: 'date', obrig: true },
  { nome: 'hora', rotulo: 'Hora', tipo: 'time' },
  { nome: 'processoId', rotulo: 'Processo', tipo: 'select', opcoes: opcoesProcessos, vazio: 'Nenhum', full: true },
  { nome: 'clienteId', rotulo: 'Cliente (se não houver processo)', tipo: 'select', opcoes: opcoesClientes, vazio: 'Nenhum', full: true },
  { nome: 'local', rotulo: 'Local / link da sala virtual', full: true },
  { nome: 'observacoes', rotulo: 'Observações', tipo: 'textarea' },
  { nome: 'concluido', rotulo: 'Concluído', tipo: 'checkbox' },
];

function formEvento(id, valores = {}) {
  abrirForm({
    titulo: id ? 'Editar compromisso' : 'Novo prazo / compromisso',
    campos: CAMPOS_EVENTO,
    valores: id ? buscar('eventos', id) : { data: hoje(), ...valores },
    onSalvar: (d) => {
      if (d.processoId && !d.clienteId) d.clienteId = buscar('processos', d.processoId)?.clienteId || '';
      gravar('eventos', { ...d, id });
      toast('Compromisso salvo');
    },
    onExcluir: id ? () => {
      if (!confirm('Excluir este compromisso?')) return false;
      remover('eventos', id);
      toast('Compromisso excluído');
    } : null,
  });
}

const CAMPOS_LEAD = [
  { nome: 'nome', rotulo: 'Nome', obrig: true, full: true },
  { nome: 'telefone', rotulo: 'Telefone / WhatsApp', tipo: 'tel', mascara: 'tel' },
  { nome: 'email', rotulo: 'E-mail', tipo: 'email' },
  { nome: 'origem', rotulo: 'Origem', tipo: 'select', opcoes: ORIGENS, padrao: 'Site' },
  { nome: 'area', rotulo: 'Área de interesse', tipo: 'select', opcoes: AREAS, padrao: 'Previdenciário' },
  { nome: 'etapa', rotulo: 'Etapa', tipo: 'select', opcoes: ETAPAS.map((e) => ({ v: e.id, l: e.nome })), padrao: 'novo' },
  { nome: 'valorEstimado', rotulo: 'Honorários estimados (R$)', tipo: 'money' },
  { nome: 'proximoContato', rotulo: 'Próximo contato', tipo: 'date' },
  { nome: 'motivoPerda', rotulo: 'Motivo da perda (se perdido)' },
  { nome: 'descricao', rotulo: 'Resumo do caso / anotações', tipo: 'textarea', linhas: 4 },
];

function formLead(id) {
  abrirForm({
    titulo: id ? 'Editar lead' : 'Novo lead',
    campos: CAMPOS_LEAD,
    valores: id ? buscar('leads', id) : { proximoContato: hoje() },
    onSalvar: (d) => { gravar('leads', { ...d, id }); toast('Lead salvo'); },
    onExcluir: id ? () => {
      if (!confirm('Excluir este lead?')) return false;
      remover('leads', id);
    } : null,
  });
}

function converterLead(id) {
  const l = buscar('leads', id);
  if (l.clienteId && buscar('clientes', l.clienteId)) { location.hash = `#/cliente/${l.clienteId}`; return; }
  const c = gravar('clientes', {
    nome: l.nome, tipo: 'PF', telefone: l.telefone, email: l.email, origem: l.origem,
    observacoes: l.descricao ? `Resumo do primeiro contato: ${l.descricao}` : '',
  });
  gravar('leads', { id, etapa: 'fechado', clienteId: c.id });
  toast('Lead convertido em cliente');
  aposNavegar = () => formCliente(c.id);
  location.hash = `#/cliente/${c.id}`;
}

function formHonorario(id, valores = {}) {
  if (!db.clientes.length) { toast('Cadastre um cliente primeiro'); return formCliente(); }
  const campos = [
    { nome: 'clienteId', rotulo: 'Cliente', tipo: 'select', opcoes: opcoesClientes, obrig: true, vazio: 'Selecione…', full: true },
    { nome: 'processoId', rotulo: 'Processo vinculado', tipo: 'select', opcoes: opcoesProcessos, vazio: 'Nenhum', full: true },
    { nome: 'descricao', rotulo: 'Descrição', obrig: true, full: true, placeholder: 'Ex.: Honorários contratuais — ação contra o INSS' },
    { nome: 'tipo', rotulo: 'Modalidade', tipo: 'select', opcoes: TIPOS_HON, padrao: 'Parcelado' },
    { nome: 'percentualExito', rotulo: '% sobre o êxito', tipo: 'number', dica: 'Se houver cláusula de êxito' },
    { nome: 'dataContrato', rotulo: 'Data do contrato', tipo: 'date', padrao: hoje() },
  ];
  if (!id) {
    campos.push(
      { tipo: 'secao', rotulo: 'Gerar parcelas' },
      { nome: 'valorTotal', rotulo: 'Valor total (R$)', tipo: 'money', dica: 'Deixe vazio para êxito ainda sem valor' },
      { nome: 'qtdParcelas', rotulo: 'Nº de parcelas', tipo: 'number', padrao: 1 },
      { nome: 'primeiroVencimento', rotulo: '1º vencimento', tipo: 'date', padrao: hoje() },
    );
  }
  campos.push({ nome: 'observacoes', rotulo: 'Observações', tipo: 'textarea' });

  abrirForm({
    titulo: id ? 'Editar contrato de honorários' : 'Novo contrato de honorários',
    campos,
    valores: id ? buscar('honorarios', id) : valores,
    onSalvar: (d) => {
      if (id) { gravar('honorarios', { ...d, id }); toast('Contrato salvo'); return; }
      const { valorTotal, qtdParcelas, primeiroVencimento, ...resto } = d;
      const parcelas = valorTotal > 0 ? gerarParcelas(valorTotal, qtdParcelas, primeiroVencimento || hoje()) : [];
      const h = gravar('honorarios', { ...resto, parcelas });
      toast('Contrato criado');
      location.hash = `#/honorario/${h.id}`;
    },
    onExcluir: id ? () => {
      if (!confirm('Excluir este contrato e todas as suas parcelas?')) return false;
      const h = buscar('honorarios', id);
      remover('honorarios', id);
      location.hash = `#/cliente/${h.clienteId}`;
    } : null,
  });
}

function formParcela(hid, pid) {
  const h = buscar('honorarios', hid);
  const p = pid ? h.parcelas.find((x) => x.id === pid) : null;
  abrirForm({
    titulo: p ? `Parcela ${p.numero}` : 'Nova parcela',
    campos: [
      { nome: 'vencimento', rotulo: 'Vencimento', tipo: 'date', obrig: true },
      { nome: 'valor', rotulo: 'Valor (R$)', tipo: 'money', obrig: true },
      { nome: 'pago', rotulo: 'Pago', tipo: 'checkbox', full: true },
      { nome: 'dataPagamento', rotulo: 'Data do pagamento', tipo: 'date' },
      { nome: 'forma', rotulo: 'Forma de pagamento', tipo: 'select', opcoes: FORMAS_PGTO, vazio: '—' },
      { nome: 'obs', rotulo: 'Observação', full: true },
    ],
    valores: p || { vencimento: hoje() },
    onSalvar: (d) => {
      if (d.pago && !d.dataPagamento) d.dataPagamento = hoje();
      if (!d.pago) d.dataPagamento = '';
      if (p) Object.assign(p, d);
      else h.parcelas.push({ id: uid(), numero: h.parcelas.length + 1, ...d });
      salvar();
    },
    onExcluir: p ? () => {
      if (!confirm('Excluir esta parcela?')) return false;
      h.parcelas = h.parcelas.filter((x) => x.id !== pid);
      h.parcelas.forEach((x, i) => { x.numero = i + 1; });
      salvar();
    } : null,
  });
}

function formRegistro(col, id, lista, titulo) {
  abrirForm({
    titulo,
    campos: [
      { nome: 'data', rotulo: 'Data', tipo: 'date', obrig: true, padrao: hoje() },
      { nome: 'descricao', rotulo: 'Descrição', tipo: 'textarea', obrig: true, linhas: 5 },
    ],
    onSalvar: (d) => {
      const obj = buscar(col, id);
      obj[lista] = [...(obj[lista] || []), { id: uid(), ...d }];
      salvar();
    },
  });
}

function linhaTempo(itens, col, id, lista) {
  if (!itens?.length) return '<p class="vazio">Nenhum registro.</p>';
  return `<ul class="linha-tempo">${[...itens].sort((a, b) => b.data.localeCompare(a.data)).map((r) => `
    <li><span class="data">${fmtData(r.data)}</span>
      <button class="btn-link perigo" style="float:right;font-size:12px" data-acao="removerRegistro" data-col="${col}" data-id="${id}" data-lista="${lista}" data-rid="${r.id}">remover</button>
      <p>${esc(r.descricao)}</p></li>`).join('')}</ul>`;
}

// ===== Estado de filtros =====
const filtros = {
  clientes: { q: '', tipo: '' },
  processos: { q: '', status: 'ativos', area: '' },
  agenda: { q: '', situacao: 'pendentes', tipo: '' },
  leads: { q: '' },
  financeiro: { q: '', status: 'abertas', mes: '' },
};
const inputFiltro = (chave, attrs = '') => {
  const [v, k] = chave.split('.');
  return `data-filtro="${chave}" value="${esc(filtros[v][k])}" ${attrs}`;
};
const selectFiltro = (chave, opcoes) => {
  const [v, k] = chave.split('.');
  return `<select data-filtro="${chave}">${opcoes.map(([val, rot]) => `<option value="${esc(val)}" ${filtros[v][k] === val ? 'selected' : ''}>${esc(rot)}</option>`).join('')}</select>`;
};

// ===== Telas =====
const btn = (rotulo, acao, extra = '', cls = 'primario') => `<button class="btn ${cls}" data-acao="${acao}" ${extra}>${rotulo}</button>`;
const kpi = (rot, val, cls = '', sub = '') => `<div class="kpi ${cls}"><span>${rot}</span><strong>${val}</strong>${sub ? `<small>${sub}</small>` : ''}</div>`;

function telaPainel() {
  const h = hoje();
  const pendentes = db.eventos.filter((e) => !e.concluido).sort(ordenarEventos);
  const atrasados = pendentes.filter((e) => e.data < h);
  const semana = pendentes.filter((e) => e.data >= h && diasAte(e.data) <= 7);
  const proximos = pendentes.filter((e) => diasAte(e.data) <= 15).slice(0, 12);
  const parcelas = todasParcelas().filter((p) => !p.pago);
  const vencidas = parcelas.filter((p) => p.vencimento < h);
  const mes = h.slice(0, 7);
  const aReceberMes = parcelas.filter((p) => p.vencimento.startsWith(mes) && p.vencimento >= h);
  const recebidoMes = todasParcelas().filter((p) => p.pago && (p.dataPagamento || '').startsWith(mes));
  const leadsAbertos = db.leads.filter((l) => !['fechado', 'perdido'].includes(l.etapa));
  const followUp = leadsAbertos.filter((l) => !l.proximoContato || diasAte(l.proximoContato) <= 2)
    .sort((a, b) => (a.proximoContato || '').localeCompare(b.proximoContato || ''));
  const cobrar = parcelas.filter((p) => diasAte(p.vencimento) <= 10).sort((a, b) => a.vencimento.localeCompare(b.vencimento)).slice(0, 10);

  const totalRegistros = COLECOES.reduce((t, c) => t + db[c].length, 0);
  const ultimo = db.meta.ultimoBackup;
  const avisoBackup = totalRegistros && (!ultimo || diasAte(ultimo.slice(0, 10)) < -7)
    ? `<div class="aviso"><span>⚠️ ${ultimo ? `Último backup em ${fmtData(ultimo)}.` : 'Você ainda não fez nenhum backup.'} Os dados ficam só neste navegador — exporte uma cópia regularmente.</span>${btn('Fazer backup agora', 'exportarBackup')}</div>`
    : '';
  const boasVindas = !totalRegistros
    ? `<div class="aviso info"><span>👋 Bem-vindo! Comece cadastrando um cliente ou um lead — ou carregue dados de exemplo para conhecer o sistema.</span>
       <span style="display:flex;gap:8px;flex-wrap:wrap">${btn('Carregar exemplo', 'carregarExemplo', '', '')}${btn('+ Novo cliente', 'novoCliente')}</span></div>`
    : '';

  return {
    titulo: 'Painel',
    acoes: btn('+ Prazo', 'novoEvento', '', '') + btn('+ Cliente', 'novoCliente'),
    html: `${boasVindas}${avisoBackup}
      <div class="kpis">
        ${kpi('Prazos atrasados', atrasados.length, atrasados.length ? 'perigo' : 'sucesso')}
        ${kpi('Próximos 7 dias', semana.length, semana.length ? 'alerta' : '')}
        ${kpi('Processos ativos', db.processos.filter(processoAtivo).length, '', `${db.clientes.length} cliente(s)`)}
        ${kpi('Leads em aberto', leadsAbertos.length, '', fmtMoeda(soma(leadsAbertos, (l) => l.valorEstimado)) + ' em potencial')}
        ${kpi('Recebido no mês', fmtMoeda(soma(recebidoMes, (p) => p.valor)), 'sucesso', `a receber: ${fmtMoeda(soma(aReceberMes, (p) => p.valor))}`)}
        ${kpi('Em atraso', fmtMoeda(soma(vencidas, (p) => p.valor)), vencidas.length ? 'perigo' : '', `${vencidas.length} parcela(s)`)}
      </div>
      <div class="grade g2">
        <section class="cartao">
          <div class="cartao-cab"><h3>Prazos e compromissos (15 dias)</h3><a href="#/agenda">ver agenda →</a></div>
          ${listaEventos(proximos)}
        </section>
        <div>
          <section class="cartao">
            <div class="cartao-cab"><h3>Honorários a cobrar</h3><a href="#/financeiro">financeiro →</a></div>
            ${cobrar.length ? `<div class="tabela-wrap"><table><tbody>${cobrar.map((p) => {
              const s = statusParcela(p);
              return `<tr><td><a href="#/honorario/${p.h.id}">${esc(nomeCliente(p.h.clienteId))}</a><span class="sub">Parcela ${p.numero}/${p.qtd} · ${fmtData(p.vencimento)}</span></td>
                <td class="num">${fmtMoeda(p.valor)}<br><span class="etiqueta ${s.c}">${s.t}</span></td>
                <td class="acoes"><button class="btn peq" data-acao="pagarParcela" data-hid="${p.h.id}" data-pid="${p.id}">Recebido</button></td></tr>`;
            }).join('')}</tbody></table></div>` : '<p class="vazio">Nenhuma parcela vencida ou a vencer nos próximos 10 dias.</p>'}
          </section>
          <section class="cartao">
            <div class="cartao-cab"><h3>Leads para retornar</h3><a href="#/leads">funil →</a></div>
            ${followUp.length ? `<ul class="eventos">${followUp.slice(0, 8).map((l) => {
              const d = diasAte(l.proximoContato);
              return `<li class="evento"><div class="corpo"><span class="titulo">${esc(l.nome)}</span>
                <span class="sub">${esc(nomeEtapa(l.etapa))} · ${esc(l.area || '')}${l.telefone ? ` · <a href="${linkWhats(l.telefone)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}</span></div>
                <div class="quando">${l.proximoContato ? `<span class="etiqueta ${d < 0 ? 'perigo' : d === 0 ? 'alerta' : 'info'}">${rotuloDias(d)}</span>` : '<span class="etiqueta">sem data</span>'}
                <div><button class="btn-link" data-acao="editarLead" data-id="${l.id}">abrir</button></div></div></li>`;
            }).join('')}</ul>` : '<p class="vazio">Nenhum retorno pendente.</p>'}
          </section>
        </div>
      </div>`,
  };
}

function telaClientes() {
  return {
    titulo: 'Clientes',
    acoes: btn('+ Novo cliente', 'novoCliente'),
    html: `<div class="barra-filtros">
        <input type="search" placeholder="Buscar por nome, CPF/CNPJ, telefone ou e-mail…" ${inputFiltro('clientes.q')}>
        ${selectFiltro('clientes.tipo', [['', 'PF e PJ'], ['PF', 'Pessoa física'], ['PJ', 'Pessoa jurídica']])}
      </div>
      <section class="cartao"><div id="lista"></div></section>`,
    lista: () => {
      const f = filtros.clientes;
      const itens = db.clientes
        .filter((c) => (!f.tipo || c.tipo === f.tipo) && contem(f.q, c.nome, c.documento, soDigitos(c.documento), c.telefone, soDigitos(c.telefone), c.email))
        .sort((a, b) => a.nome.localeCompare(b.nome));
      if (!itens.length) return `<p class="vazio">${db.clientes.length ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}</p>`;
      return `<div class="tabela-wrap"><table>
        <thead><tr><th>Nome</th><th>Contato</th><th>Processos</th><th class="num">Saldo a receber</th></tr></thead>
        <tbody>${itens.map((c) => {
          const procs = db.processos.filter((p) => p.clienteId === c.id);
          const saldo = soma(db.honorarios.filter((h) => h.clienteId === c.id), (h) => resumoHonorario(h).saldo);
          return `<tr>
            <td><a href="#/cliente/${c.id}"><strong>${esc(c.nome)}</strong></a><span class="sub">${esc(c.tipo || 'PF')} ${esc(c.documento || '')}</span></td>
            <td>${esc(c.telefone || '')}${c.telefone ? ` <a href="${linkWhats(c.telefone)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}<span class="sub">${esc(c.email || '')}</span></td>
            <td>${procs.filter(processoAtivo).length} ativo(s)<span class="sub">${procs.length} no total</span></td>
            <td class="num">${saldo ? fmtMoeda(saldo) : '—'}</td></tr>`;
        }).join('')}</tbody></table></div>
        <p class="muted" style="margin:10px 0 0;font-size:13px">${itens.length} cliente(s)</p>`;
    },
  };
}

function ficha(pares) {
  const itens = pares.filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!itens.length) return '<p class="muted">Sem dados adicionais.</p>';
  return `<dl class="ficha">${itens.map(([k, v, full]) => `<div class="${full ? 'full' : ''}"><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
}

function tabelaProcessos(procs) {
  if (!procs.length) return '<p class="vazio">Nenhum processo.</p>';
  return `<div class="tabela-wrap"><table>
    <thead><tr><th>Processo</th><th>Área / ação</th><th>Juízo</th><th>Situação</th><th>Próximo prazo</th></tr></thead>
    <tbody>${procs.map((p) => {
      const prox = db.eventos.filter((e) => e.processoId === p.id && !e.concluido).sort(ordenarEventos)[0];
      return `<tr>
        <td><a href="#/processo/${p.id}"><strong>${esc(rotuloProcesso(p))}</strong></a><span class="sub">${esc(nomeCliente(p.clienteId))}</span></td>
        <td>${esc(p.area || '')}<span class="sub">${esc(p.tipoAcao || '')}</span></td>
        <td>${esc([p.tribunal, p.vara].filter(Boolean).join(' · '))}<span class="sub">${esc(p.comarca || '')}</span></td>
        <td><span class="etiqueta ${processoAtivo(p) ? 'info' : ''}">${esc(p.status)}</span><span class="sub">${esc(p.fase || '')}</span></td>
        <td>${prox ? `${fmtData(prox.data)}<br><span class="etiqueta ${urgencia(prox)}">${rotuloDias(diasAte(prox.data))}</span>` : '<span class="muted">—</span>'}</td>
      </tr>`;
    }).join('')}</tbody></table></div>`;
}

function tabelaHonorarios(hons) {
  if (!hons.length) return '<p class="vazio">Nenhum contrato de honorários.</p>';
  return `<div class="tabela-wrap"><table>
    <thead><tr><th>Contrato</th><th>Modalidade</th><th class="num">Total</th><th class="num">Recebido</th><th class="num">Saldo</th></tr></thead>
    <tbody>${hons.map((h) => {
      const r = resumoHonorario(h);
      return `<tr><td><a href="#/honorario/${h.id}"><strong>${esc(h.descricao)}</strong></a><span class="sub">${esc(nomeCliente(h.clienteId))}</span></td>
        <td>${esc(h.tipo || '')}${h.percentualExito ? `<span class="sub">${esc(h.percentualExito)}% do êxito</span>` : ''}</td>
        <td class="num">${fmtMoeda(r.total)}</td><td class="num">${fmtMoeda(r.recebido)}</td>
        <td class="num">${fmtMoeda(r.saldo)}${r.vencido ? `<br><span class="etiqueta perigo">${fmtMoeda(r.vencido)} vencido</span>` : ''}</td></tr>`;
    }).join('')}</tbody></table></div>`;
}

function telaCliente(id) {
  const c = buscar('clientes', id);
  if (!c) return telaNaoEncontrado();
  const procs = db.processos.filter((p) => p.clienteId === id);
  const procIds = new Set(procs.map((p) => p.id));
  const evs = db.eventos.filter((e) => !e.concluido && (e.clienteId === id || procIds.has(e.processoId))).sort(ordenarEventos);
  const hons = db.honorarios.filter((h) => h.clienteId === id);
  const idade = c.nascimento ? Math.floor(-diasAte(c.nascimento) / 365.25) : null;
  return {
    titulo: c.nome,
    acoes: '',
    html: `<a class="voltar" href="#/clientes">← Clientes</a>
      <div class="cab-detalhe">
        <div><h2>${esc(c.nome)}</h2><span class="muted">${c.tipo === 'PJ' ? 'Pessoa jurídica' : 'Pessoa física'} · cliente desde ${fmtData(c.criadoEm)}</span></div>
        <div class="acoes">
          ${c.telefone ? `<a class="btn" href="${linkWhats(c.telefone)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
          ${c.email ? `<a class="btn" href="mailto:${esc(c.email)}">E-mail</a>` : ''}
          ${btn('Editar', 'editarCliente', `data-id="${id}"`, '')}
        </div>
      </div>
      <section class="cartao">
        ${ficha([
          ['CPF / CNPJ', esc(c.documento)], ['Telefone', esc(c.telefone)], ['E-mail', esc(c.email)],
          ['Nascimento', c.nascimento ? `${fmtData(c.nascimento)} (${idade} anos)` : ''], ['Profissão', esc(c.profissao)],
          ['Benefício INSS', esc(c.beneficioINSS)], ['Origem', esc(c.origem)], ['Endereço', esc(c.endereco), true],
          ['Observações', c.observacoes ? `<span style="white-space:pre-wrap">${esc(c.observacoes)}</span>` : '', true],
        ])}
      </section>
      <section class="cartao">
        <div class="cartao-cab"><h3>Processos</h3>${btn('+ Processo', 'novoProcesso', `data-cliente="${id}"`, 'peq')}</div>
        ${tabelaProcessos(procs)}
      </section>
      <div class="grade g2">
        <section class="cartao">
          <div class="cartao-cab"><h3>Prazos e compromissos</h3>${btn('+ Compromisso', 'novoEvento', `data-cliente="${id}"`, 'peq')}</div>
          ${listaEventos(evs)}
        </section>
        <section class="cartao">
          <div class="cartao-cab"><h3>Histórico de atendimentos</h3>${btn('+ Registrar', 'novoAtendimento', `data-id="${id}"`, 'peq')}</div>
          ${linhaTempo(c.atendimentos, 'clientes', id, 'atendimentos')}
        </section>
      </div>
      <section class="cartao" style="margin-top:18px">
        <div class="cartao-cab"><h3>Honorários</h3>${btn('+ Contrato', 'novoHonorario', `data-cliente="${id}"`, 'peq')}</div>
        ${tabelaHonorarios(hons)}
      </section>`,
  };
}

function telaProcessos() {
  return {
    titulo: 'Processos',
    acoes: btn('+ Novo processo', 'novoProcesso'),
    html: `<div class="barra-filtros">
        <input type="search" placeholder="Buscar por número, cliente, parte contrária, vara…" ${inputFiltro('processos.q')}>
        ${selectFiltro('processos.status', [['ativos', 'Em andamento'], ['encerrados', 'Encerrados'], ['', 'Todos']])}
        ${selectFiltro('processos.area', [['', 'Todas as áreas'], ...AREAS.map((a) => [a, a])])}
      </div>
      <section class="cartao"><div id="lista"></div></section>`,
    lista: () => {
      const f = filtros.processos;
      const itens = db.processos.filter((p) =>
        (f.status !== 'ativos' || processoAtivo(p)) && (f.status !== 'encerrados' || !processoAtivo(p)) &&
        (!f.area || p.area === f.area) &&
        contem(f.q, p.numero, soDigitos(p.numero), nomeCliente(p.clienteId), p.parteContraria, p.vara, p.tribunal, p.tipoAcao, p.comarca))
        .sort((a, b) => nomeCliente(a.clienteId).localeCompare(nomeCliente(b.clienteId)));
      return tabelaProcessos(itens) + `<p class="muted" style="margin:10px 0 0;font-size:13px">${itens.length} processo(s)</p>`;
    },
  };
}

function telaProcesso(id) {
  const p = buscar('processos', id);
  if (!p) return telaNaoEncontrado();
  const evs = db.eventos.filter((e) => e.processoId === id);
  const pend = evs.filter((e) => !e.concluido).sort(ordenarEventos);
  const concl = evs.filter((e) => e.concluido).sort(ordenarEventos).reverse();
  const hons = db.honorarios.filter((h) => h.processoId === id);
  return {
    titulo: rotuloProcesso(p),
    acoes: '',
    html: `<a class="voltar" href="#/cliente/${p.clienteId}">← ${esc(nomeCliente(p.clienteId))}</a>
      <div class="cab-detalhe">
        <div><h2>${esc(rotuloProcesso(p))}</h2>
          <span class="etiqueta ${processoAtivo(p) ? 'info' : ''}">${esc(p.status)}</span> <span class="muted">${esc(p.area || '')}${p.tipoAcao ? ' · ' + esc(p.tipoAcao) : ''}</span></div>
        <div class="acoes">
          ${p.numero ? `<button class="btn" data-acao="copiar" data-texto="${esc(p.numero)}">Copiar número</button>` : ''}
          ${p.link ? `<a class="btn" href="${esc(p.link)}" target="_blank" rel="noopener">Consultar</a>` : ''}
          ${btn('Editar', 'editarProcesso', `data-id="${id}"`, '')}
        </div>
      </div>
      <section class="cartao">
        ${ficha([
          ['Cliente', `<a href="#/cliente/${p.clienteId}">${esc(nomeCliente(p.clienteId))}</a>${p.polo ? ` (${esc(p.polo)})` : ''}`],
          ['Parte contrária', esc(p.parteContraria)], ['Tribunal', esc(p.tribunal)], ['Vara / juízo', esc(p.vara)],
          ['Comarca', esc(p.comarca)], ['Fase', esc(p.fase)], ['Valor da causa', p.valorCausa ? fmtMoeda(p.valorCausa) : ''],
          ['Distribuição', fmtData(p.distribuicao)],
          ['Observações', p.observacoes ? `<span style="white-space:pre-wrap">${esc(p.observacoes)}</span>` : '', true],
        ])}
      </section>
      <div class="grade g2">
        <section class="cartao">
          <div class="cartao-cab"><h3>Prazos e audiências</h3>${btn('+ Prazo', 'novoEvento', `data-processo="${id}"`, 'peq')}</div>
          ${listaEventos(pend, { mostrarVinculo: false })}
          ${concl.length ? `<details style="margin-top:10px"><summary class="muted">${concl.length} concluído(s)</summary>${listaEventos(concl, { mostrarVinculo: false })}</details>` : ''}
        </section>
        <section class="cartao">
          <div class="cartao-cab"><h3>Andamentos</h3>${btn('+ Andamento', 'novoAndamento', `data-id="${id}"`, 'peq')}</div>
          ${linhaTempo(p.andamentos, 'processos', id, 'andamentos')}
        </section>
      </div>
      <section class="cartao" style="margin-top:18px">
        <div class="cartao-cab"><h3>Honorários deste processo</h3>${btn('+ Contrato', 'novoHonorario', `data-cliente="${p.clienteId}" data-processo="${id}"`, 'peq')}</div>
        ${tabelaHonorarios(hons)}
      </section>`,
  };
}

function telaAgenda() {
  return {
    titulo: 'Prazos e agenda',
    acoes: btn('Exportar p/ Google Agenda', 'exportarICS', '', '') + btn('+ Novo compromisso', 'novoEvento'),
    html: `<section class="cartao">
        <div class="cartao-cab"><h3>Calculadora de prazo processual</h3></div>
        <form id="form-calc" class="calc">
          <label class="campo"><span>Intimação / publicação</span><input type="date" name="inicio" value="${hoje()}" required></label>
          <label class="campo"><span>Prazo (dias)</span><input type="number" name="dias" value="15" min="1" required></label>
          <label class="campo"><span>Contagem</span><select name="uteis"><option value="1">Dias úteis (CPC)</option><option value="0">Dias corridos</option></select></label>
          <button class="btn primario" type="submit">Calcular</button>
        </form>
        <div id="resultado-calc"></div>
        <p class="muted" style="font-size:12px;margin:10px 0 0">Considera fins de semana, feriados nacionais, Carnaval, Sexta-feira Santa, Corpus Christi e o recesso forense (20/12 a 20/01).
        Não considera feriados estaduais/municipais nem suspensões do tribunal — confira sempre no calendário do órgão.</p>
      </section>
      <div class="barra-filtros">
        <input type="search" placeholder="Buscar compromisso, processo ou cliente…" ${inputFiltro('agenda.q')}>
        ${selectFiltro('agenda.situacao', [['pendentes', 'Pendentes'], ['concluidos', 'Concluídos'], ['', 'Todos']])}
        ${selectFiltro('agenda.tipo', [['', 'Todos os tipos'], ...TIPOS_EVENTO.map((t) => [t, t])])}
      </div>
      <section class="cartao"><div id="lista"></div></section>`,
    lista: () => {
      const f = filtros.agenda;
      const itens = db.eventos.filter((e) => {
        if (f.situacao === 'pendentes' && e.concluido) return false;
        if (f.situacao === 'concluidos' && !e.concluido) return false;
        if (f.tipo && e.tipo !== f.tipo) return false;
        const proc = e.processoId && buscar('processos', e.processoId);
        return contem(f.q, e.titulo, e.local, proc?.numero, nomeCliente(e.clienteId || proc?.clienteId));
      }).sort(ordenarEventos);
      if (!itens.length) return '<p class="vazio">Nenhum compromisso encontrado.</p>';
      if (f.situacao !== 'pendentes') return listaEventos(f.situacao === 'concluidos' ? itens.reverse() : itens);
      const grupos = [
        ['Atrasados', (d) => d < 0, 'perigo'], ['Hoje', (d) => d === 0], ['Amanhã', (d) => d === 1],
        ['Próximos 7 dias', (d) => d > 1 && d <= 7], ['Próximos 30 dias', (d) => d > 7 && d <= 30], ['Mais adiante', (d) => d > 30],
      ];
      return grupos.map(([nome, teste, cls]) => {
        const g = itens.filter((e) => teste(diasAte(e.data)));
        return g.length ? `<h4 class="grupo-titulo ${cls || ''}">${nome} (${g.length})</h4>${listaEventos(g)}` : '';
      }).join('');
    },
    depois: () => {
      $('#form-calc').addEventListener('submit', (e) => {
        e.preventDefault();
        const f = e.target.elements;
        const dias = parseInt(f.dias.value, 10);
        if (!f.inicio.value || !(dias > 0)) return;
        const venc = calcularPrazo(f.inicio.value, dias, f.uteis.value === '1');
        $('#resultado-calc').innerHTML = `<div class="resultado-calc">
          <span>Vencimento: <strong>${fmtData(venc)}</strong> (${diaSemana(venc)}) · ${rotuloDias(diasAte(venc))}</span>
          ${btn('Criar prazo na agenda', 'novoEvento', `data-data="${venc}" data-titulo="Prazo de ${dias} dias ${f.uteis.value === '1' ? 'úteis' : 'corridos'} (intimação em ${fmtData(f.inicio.value)})"`, 'peq')}
        </div>`;
      });
    },
  };
}

function telaLeads() {
  return {
    titulo: 'Funil de leads',
    acoes: btn('+ Novo lead', 'novoLead'),
    html: `<div class="barra-filtros">
        <input type="search" placeholder="Buscar lead…" ${inputFiltro('leads.q')}>
        <span class="muted" style="font-size:13px">Arraste os cartões entre as colunas ou use as setas.</span>
      </div>
      <div id="lista"></div>`,
    lista: () => {
      const f = filtros.leads;
      const leads = db.leads.filter((l) => contem(f.q, l.nome, l.telefone, l.email, l.descricao, l.area, l.origem));
      const abertos = db.leads.filter((l) => !['fechado', 'perdido'].includes(l.etapa)).length;
      const fechados = db.leads.filter((l) => l.etapa === 'fechado').length;
      const perdidos = db.leads.filter((l) => l.etapa === 'perdido').length;
      const taxa = fechados + perdidos ? Math.round((fechados / (fechados + perdidos)) * 100) : null;
      return `<div class="kpis">
          ${kpi('Em negociação', abertos)}
          ${kpi('Potencial em aberto', fmtMoeda(soma(db.leads.filter((l) => !['fechado', 'perdido'].includes(l.etapa)), (l) => l.valorEstimado)))}
          ${kpi('Contratos fechados', fechados, 'sucesso')}
          ${kpi('Taxa de conversão', taxa === null ? '—' : taxa + '%', '', 'fechados ÷ (fechados + perdidos)')}
        </div>
        <div class="kanban">${ETAPAS.map((et, i) => {
          const cards = leads.filter((l) => l.etapa === et.id).sort((a, b) => (a.proximoContato || '9').localeCompare(b.proximoContato || '9'));
          return `<div class="kanban-col" data-etapa="${et.id}">
            <div class="kanban-cab">${et.nome}<small>${cards.length}</small></div>
            <div class="kanban-cards">${cards.map((l) => {
              const d = diasAte(l.proximoContato);
              const aberto = !['fechado', 'perdido'].includes(l.etapa);
              return `<div class="lead-card" draggable="true" data-lead="${l.id}">
                <div class="nome">${esc(l.nome)}</div>
                <div class="linha">${esc([l.area, l.origem].filter(Boolean).join(' · '))}</div>
                ${l.telefone ? `<div class="linha"><a href="${linkWhats(l.telefone)}" target="_blank" rel="noopener">${esc(l.telefone)}</a></div>` : ''}
                ${l.valorEstimado ? `<div class="linha">${fmtMoeda(l.valorEstimado)}</div>` : ''}
                ${aberto && l.proximoContato ? `<div class="linha"><span class="etiqueta ${d < 0 ? 'perigo' : d <= 1 ? 'alerta' : ''}">retorno: ${fmtData(l.proximoContato)}</span></div>` : ''}
                ${l.etapa === 'perdido' && l.motivoPerda ? `<div class="linha">Motivo: ${esc(l.motivoPerda)}</div>` : ''}
                <div class="rodape">
                  ${i > 0 ? `<button class="btn peq" data-acao="moverLead" data-id="${l.id}" data-dir="-1" title="Etapa anterior">◀</button>` : ''}
                  ${i < ETAPAS.length - 1 ? `<button class="btn peq" data-acao="moverLead" data-id="${l.id}" data-dir="1" title="Próxima etapa">▶</button>` : ''}
                  <button class="btn peq" data-acao="editarLead" data-id="${l.id}">Editar</button>
                  ${l.etapa !== 'perdido' ? `<button class="btn peq" data-acao="converterLead" data-id="${l.id}">${l.clienteId ? 'Ver cliente' : 'Virar cliente'}</button>` : ''}
                </div>
              </div>`;
            }).join('')}</div>
          </div>`;
        }).join('')}</div>`;
    },
  };
}

function telaFinanceiro() {
  const h = hoje();
  const mes = h.slice(0, 7);
  const todas = todasParcelas();
  const abertas = todas.filter((p) => !p.pago);
  const vencidas = abertas.filter((p) => p.vencimento < h);
  return {
    titulo: 'Financeiro',
    acoes: btn('+ Contrato de honorários', 'novoHonorario'),
    html: `<div class="kpis">
        ${kpi('Recebido no mês', fmtMoeda(soma(todas.filter((p) => p.pago && (p.dataPagamento || '').startsWith(mes)), (p) => p.valor)), 'sucesso')}
        ${kpi('A receber no mês', fmtMoeda(soma(abertas.filter((p) => p.vencimento.startsWith(mes) && p.vencimento >= h), (p) => p.valor)), 'alerta')}
        ${kpi('Em atraso', fmtMoeda(soma(vencidas, (p) => p.valor)), vencidas.length ? 'perigo' : '', `${vencidas.length} parcela(s)`)}
        ${kpi('Total a receber', fmtMoeda(soma(abertas, (p) => p.valor)), '', `${abertas.length} parcela(s) em aberto`)}
      </div>
      <div class="barra-filtros">
        <input type="search" placeholder="Buscar por cliente ou contrato…" ${inputFiltro('financeiro.q')}>
        ${selectFiltro('financeiro.status', [['abertas', 'Em aberto'], ['vencidas', 'Vencidas'], ['pagas', 'Pagas'], ['', 'Todas']])}
        <input type="month" title="Filtrar por mês de vencimento" ${inputFiltro('financeiro.mes')}>
      </div>
      <section class="cartao"><div class="cartao-cab"><h3>Parcelas</h3></div><div id="lista"></div></section>
      <section class="cartao"><div class="cartao-cab"><h3>Contratos de honorários</h3></div>
        ${tabelaHonorarios([...db.honorarios].sort((a, b) => resumoHonorario(b).saldo - resumoHonorario(a).saldo))}
      </section>`,
    lista: () => {
      const f = filtros.financeiro;
      const itens = todasParcelas().filter((p) => {
        if (f.status === 'abertas' && p.pago) return false;
        if (f.status === 'pagas' && !p.pago) return false;
        if (f.status === 'vencidas' && (p.pago || p.vencimento >= hoje())) return false;
        if (f.mes && !p.vencimento.startsWith(f.mes)) return false;
        return contem(f.q, nomeCliente(p.h.clienteId), p.h.descricao);
      }).sort((a, b) => a.vencimento.localeCompare(b.vencimento));
      if (!itens.length) return '<p class="vazio">Nenhuma parcela encontrada.</p>';
      return `<div class="tabela-wrap"><table>
        <thead><tr><th>Vencimento</th><th>Cliente / contrato</th><th>Parcela</th><th class="num">Valor</th><th>Situação</th><th></th></tr></thead>
        <tbody>${itens.map((p) => {
          const s = statusParcela(p);
          return `<tr><td>${fmtData(p.vencimento)}</td>
            <td><a href="#/honorario/${p.h.id}">${esc(nomeCliente(p.h.clienteId))}</a><span class="sub">${esc(p.h.descricao)}</span></td>
            <td>${p.numero}/${p.qtd}</td><td class="num">${fmtMoeda(p.valor)}</td>
            <td><span class="etiqueta ${s.c}">${s.t}</span>${p.pago ? `<span class="sub">em ${fmtData(p.dataPagamento)}${p.forma ? ' · ' + esc(p.forma) : ''}</span>` : ''}</td>
            <td class="acoes">${p.pago
              ? `<button class="btn-link" data-acao="estornarParcela" data-hid="${p.h.id}" data-pid="${p.id}">desfazer</button>`
              : `<button class="btn peq" data-acao="pagarParcela" data-hid="${p.h.id}" data-pid="${p.id}">Recebido</button>`}</td></tr>`;
        }).join('')}</tbody>
        <tfoot><tr><th colspan="3">Total</th><th class="num">${fmtMoeda(soma(itens, (p) => p.valor))}</th><th colspan="2"></th></tr></tfoot>
        </table></div>`;
    },
  };
}

function telaHonorario(id) {
  const h = buscar('honorarios', id);
  if (!h) return telaNaoEncontrado();
  const r = resumoHonorario(h);
  const proc = h.processoId && buscar('processos', h.processoId);
  return {
    titulo: 'Honorários',
    acoes: '',
    html: `<a class="voltar" href="#/cliente/${h.clienteId}">← ${esc(nomeCliente(h.clienteId))}</a>
      <div class="cab-detalhe">
        <div><h2>${esc(h.descricao)}</h2><span class="muted">${esc(h.tipo || '')}${h.percentualExito ? ` · ${esc(h.percentualExito)}% sobre o êxito` : ''}</span></div>
        <div class="acoes">${btn('Editar contrato', 'editarHonorario', `data-id="${id}"`, '')}</div>
      </div>
      <div class="kpis">
        ${kpi('Total contratado', fmtMoeda(r.total))}
        ${kpi('Recebido', fmtMoeda(r.recebido), 'sucesso')}
        ${kpi('Saldo', fmtMoeda(r.saldo), r.saldo ? 'alerta' : '')}
        ${kpi('Vencido', fmtMoeda(r.vencido), r.vencido ? 'perigo' : '')}
      </div>
      <section class="cartao">
        ${ficha([
          ['Cliente', `<a href="#/cliente/${h.clienteId}">${esc(nomeCliente(h.clienteId))}</a>`],
          ['Processo', proc ? `<a href="#/processo/${proc.id}">${esc(rotuloProcesso(proc))}</a>` : ''],
          ['Data do contrato', fmtData(h.dataContrato)],
          ['Observações', h.observacoes ? `<span style="white-space:pre-wrap">${esc(h.observacoes)}</span>` : '', true],
        ])}
      </section>
      <section class="cartao">
        <div class="cartao-cab"><h3>Parcelas</h3>${btn('+ Parcela', 'novaParcela', `data-hid="${id}"`, 'peq')}</div>
        ${(h.parcelas || []).length ? `<div class="tabela-wrap"><table>
          <thead><tr><th>#</th><th>Vencimento</th><th class="num">Valor</th><th>Situação</th><th></th></tr></thead>
          <tbody>${[...h.parcelas].sort((a, b) => a.numero - b.numero).map((p) => {
            const s = statusParcela(p);
            return `<tr><td>${p.numero}</td><td>${fmtData(p.vencimento)}</td><td class="num">${fmtMoeda(p.valor)}</td>
              <td><span class="etiqueta ${s.c}">${s.t}</span>${p.pago ? `<span class="sub">em ${fmtData(p.dataPagamento)}${p.forma ? ' · ' + esc(p.forma) : ''}</span>` : ''}${p.obs ? `<span class="sub">${esc(p.obs)}</span>` : ''}</td>
              <td class="acoes">${p.pago
                ? `<button class="btn-link" data-acao="estornarParcela" data-hid="${id}" data-pid="${p.id}">desfazer</button>`
                : `<button class="btn peq" data-acao="pagarParcela" data-hid="${id}" data-pid="${p.id}">Recebido</button>`}
                <button class="btn-link" data-acao="editarParcela" data-hid="${id}" data-pid="${p.id}">editar</button></td></tr>`;
          }).join('')}</tbody></table></div>` : '<p class="vazio">Nenhuma parcela. Para honorários de êxito, adicione a parcela quando o valor for definido.</p>'}
      </section>`,
  };
}

function telaConfig() {
  const total = COLECOES.map((c) => `${db[c].length} ${{ clientes: 'clientes', processos: 'processos', eventos: 'compromissos', leads: 'leads', honorarios: 'contratos' }[c]}`).join(' · ');
  const tamanho = (new Blob([localStorage.getItem(CHAVE) || '']).size / 1024).toFixed(0);
  return {
    titulo: 'Backup e ajustes',
    acoes: '',
    html: `<section class="cartao">
        <div class="cartao-cab"><h3>Backup dos dados</h3></div>
        <p>Os dados ficam salvos <strong>somente neste navegador, neste computador</strong>. Se limpar o histórico/dados do navegador ou trocar de computador, eles não vão junto.
        Exporte um backup com frequência e guarde em local seguro (ex.: Google Drive). Para usar em outro computador, importe o arquivo lá.</p>
        <p class="muted">Conteúdo atual: ${total} (${tamanho} KB).<br>Último backup: ${db.meta.ultimoBackup ? fmtData(db.meta.ultimoBackup) : 'nunca'}.</p>
        <div class="barra-filtros">
          ${btn('Exportar backup (.json)', 'exportarBackup')}
          ${btn('Importar backup', 'importarBackup', '', '')}
          <input type="file" id="arquivo-backup" accept=".json,application/json" hidden>
        </div>
      </section>
      <section class="cartao">
        <div class="cartao-cab"><h3>Exportações</h3></div>
        <div class="barra-filtros">
          ${btn('Clientes (planilha CSV)', 'exportarCSV', '', '')}
          ${btn('Agenda (.ics para Google/Outlook)', 'exportarICS', '', '')}
        </div>
        <p class="muted" style="font-size:13px;margin:0">O arquivo .ics pode ser importado no Google Agenda (Configurações → Importar) para receber lembretes no celular.</p>
      </section>
      <section class="cartao">
        <div class="cartao-cab"><h3>Escritório</h3></div>
        <form id="form-escritorio" class="barra-filtros">
          <input name="nome" value="${esc(db.meta.nomeEscritorio || 'Lopes Araújo')}" placeholder="Nome do escritório" style="flex:1;min-width:200px">
          <button class="btn" type="submit">Salvar nome</button>
        </form>
      </section>
      <section class="cartao">
        <div class="cartao-cab"><h3>Zona de perigo</h3></div>
        <div class="barra-filtros">
          ${btn('Carregar dados de exemplo', 'carregarExemplo', '', '')}
          ${btn('Apagar todos os dados', 'apagarTudo', '', 'perigo')}
        </div>
      </section>`,
    depois: () => {
      $('#arquivo-backup').addEventListener('change', importarArquivo);
      $('#form-escritorio').addEventListener('submit', (e) => {
        e.preventDefault();
        db.meta.nomeEscritorio = e.target.elements.nome.value.trim();
        salvar(); render(); toast('Nome salvo');
      });
    },
  };
}

function telaNaoEncontrado() {
  return { titulo: 'Não encontrado', acoes: '', html: '<p class="vazio">Registro não encontrado. <a href="#/">Voltar ao painel</a></p>' };
}

// ===== Backup e exportações =====
function exportarBackup() {
  db.meta.ultimoBackup = new Date().toISOString();
  salvar();
  baixar(`crm-juridico-backup-${hoje()}.json`, JSON.stringify({ app: 'crm-juridico', versao: 1, exportadoEm: db.meta.ultimoBackup, dados: db }, null, 2), 'application/json');
  toast('Backup exportado');
  render();
}

function importarArquivo(e) {
  const arq = e.target.files[0];
  if (!arq) return;
  const leitor = new FileReader();
  leitor.onload = () => {
    try {
      const json = JSON.parse(leitor.result);
      const dados = json.dados || json;
      if (!COLECOES.every((c) => Array.isArray(dados[c]))) throw new Error('arquivo não parece ser um backup deste CRM');
      const resumo = COLECOES.map((c) => `${dados[c].length} ${c}`).join(', ');
      if (!confirm(`Importar backup com ${resumo}?\n\nOs dados atuais deste navegador serão SUBSTITUÍDOS.`)) return;
      db = { ...vazio(), ...dados, meta: { ...(dados.meta || {}) } };
      salvar();
      toast('Backup importado');
      location.hash = '#/';
      render();
    } catch (err) {
      toast('Não foi possível importar: ' + err.message, 'erro');
    } finally {
      e.target.value = '';
    }
  };
  leitor.readAsText(arq);
}

function exportarCSV() {
  const cols = [['nome', 'Nome'], ['tipo', 'Tipo'], ['documento', 'CPF/CNPJ'], ['telefone', 'Telefone'], ['email', 'E-mail'],
    ['nascimento', 'Nascimento'], ['profissao', 'Profissão'], ['beneficioINSS', 'Benefício INSS'], ['origem', 'Origem'], ['endereco', 'Endereço'], ['observacoes', 'Observações']];
  const cel = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const linhas = [cols.map(([, r]) => cel(r)).join(';'),
    ...db.clientes.map((c) => cols.map(([k]) => cel(k === 'nascimento' ? fmtData(c[k]) : c[k])).join(';'))];
  baixar(`clientes-${hoje()}.csv`, '\ufeff' + linhas.join('\r\n'), 'text/csv;charset=utf-8');
}

function exportarICS() {
  const escICS = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const evs = db.eventos.filter((e) => !e.concluido && e.data);
  const linhas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CRM Juridico//PT-BR', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:CRM Jurídico'];
  for (const e of evs) {
    const proc = e.processoId && buscar('processos', e.processoId);
    const d = e.data.replace(/-/g, '');
    const desc = [proc && `Processo: ${rotuloProcesso(proc)}`, (e.clienteId || proc?.clienteId) && `Cliente: ${nomeCliente(e.clienteId || proc?.clienteId)}`, e.observacoes].filter(Boolean).join('\n');
    linhas.push('BEGIN:VEVENT', `UID:${e.id}@crm-juridico`, `DTSTAMP:${stamp}`);
    if (e.hora) {
      const [hh, mm] = e.hora.split(':');
      const fim = `${String((+hh + 1) % 24).padStart(2, '0')}${mm}00`;
      linhas.push(`DTSTART:${d}T${hh}${mm}00`, `DTEND:${+hh === 23 ? addDias(e.data, 1).replace(/-/g, '') : d}T${fim}`);
    } else {
      linhas.push(`DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${addDias(e.data, 1).replace(/-/g, '')}`);
    }
    linhas.push(`SUMMARY:${escICS(`[${e.tipo}] ${e.titulo}`)}`);
    if (desc) linhas.push(`DESCRIPTION:${escICS(desc)}`);
    if (e.local) linhas.push(`LOCATION:${escICS(e.local)}`);
    linhas.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escICS(e.titulo)}`, 'TRIGGER:-P1D', 'END:VALARM', 'END:VEVENT');
  }
  linhas.push('END:VCALENDAR');
  baixar(`agenda-${hoje()}.ics`, linhas.join('\r\n'), 'text/calendar;charset=utf-8');
  toast(`${evs.length} compromisso(s) exportado(s)`);
}

function carregarExemplo() {
  const temDados = COLECOES.some((c) => db[c].length);
  if (temDados && !confirm('Adicionar dados de exemplo aos dados existentes?')) return;
  const h = hoje();
  const c1 = gravar('clientes', { nome: 'Maria das Graças Souza', tipo: 'PF', documento: '123.456.789-09', telefone: '(65) 99999-1234', email: 'maria@exemplo.com', nascimento: '1955-03-12', profissao: 'Aposentada', beneficioINSS: '123.456.789-0', origem: 'Site', observacoes: 'Descontos de associação não autorizada no benefício desde 2023.', atendimentos: [{ id: uid(), data: addDias(h, -20), descricao: 'Consulta inicial. Trouxe extratos do INSS com descontos mensais de R$ 45,00.' }] });
  const c2 = gravar('clientes', { nome: 'José Carlos Pereira', tipo: 'PF', documento: '987.654.321-00', telefone: '(65) 98888-5678', origem: 'Indicação' });
  const c3 = gravar('clientes', { nome: 'Comercial Araguaia Ltda.', tipo: 'PJ', documento: '12.345.678/0001-90', telefone: '(65) 3333-4444', email: 'financeiro@araguaia.com', origem: 'Indicação' });
  const p1 = gravar('processos', { clienteId: c1.id, numero: '1001234-56.2026.4.01.3600', area: 'Previdenciário', tipoAcao: 'Restituição de descontos indevidos + danos morais', polo: 'Autor', parteContraria: 'INSS e Associação XYZ', tribunal: 'TRF1', vara: '1º Juizado Especial Federal', comarca: 'Cuiabá/MT', status: 'Ativo', fase: 'Conhecimento', valorCausa: 15000, distribuicao: addDias(h, -15), andamentos: [{ id: uid(), data: addDias(h, -15), descricao: 'Petição inicial distribuída.' }, { id: uid(), data: addDias(h, -3), descricao: 'Citação do INSS expedida.' }] });
  const p2 = gravar('processos', { clienteId: c2.id, numero: '0801234-11.2025.8.11.0041', area: 'Consumidor', tipoAcao: 'Revisão de contrato bancário', polo: 'Autor', parteContraria: 'Banco ABC S.A.', tribunal: 'TJMT', vara: '3ª Vara Cível', comarca: 'Cuiabá', status: 'Em recurso', fase: 'Recursal', valorCausa: 42000 });
  const p3 = gravar('processos', { clienteId: c3.id, area: 'Tributário', tipoAcao: 'Defesa em auto de infração', parteContraria: 'SEFAZ/MT', tribunal: 'SEFAZ/MT', status: 'Ativo', fase: 'Administrativo' });
  gravar('eventos', { tipo: 'Prazo', titulo: 'Réplica à contestação', data: addDias(h, 3), processoId: p1.id, clienteId: c1.id, prioridade: 'Alta' });
  gravar('eventos', { tipo: 'Audiência', titulo: 'Audiência de conciliação', data: addDias(h, 12), hora: '14:00', processoId: p1.id, clienteId: c1.id, local: 'Sala virtual — link no PJe' });
  gravar('eventos', { tipo: 'Prazo', titulo: 'Contrarrazões de apelação', data: addDias(h, -1), processoId: p2.id, clienteId: c2.id, prioridade: 'Alta' });
  gravar('eventos', { tipo: 'Prazo', titulo: 'Impugnação ao auto de infração', data: addDias(h, 20), processoId: p3.id, clienteId: c3.id });
  gravar('eventos', { tipo: 'Reunião', titulo: 'Entregar cópia do processo à cliente', data: h, hora: '10:00', clienteId: c1.id });
  gravar('leads', { nome: 'Ana Lúcia Ramos', telefone: '(65) 97777-0001', origem: 'Site', area: 'Previdenciário', etapa: 'novo', proximoContato: h, descricao: 'Preencheu o formulário do site: descontos no benefício.', valorEstimado: 2500 });
  gravar('leads', { nome: 'Roberto Dias', telefone: '(65) 97777-0002', origem: 'Instagram', area: 'Previdenciário', etapa: 'consulta', proximoContato: addDias(h, 2), valorEstimado: 3000 });
  gravar('leads', { nome: 'Francisca Lima', telefone: '(65) 97777-0003', origem: 'Indicação', area: 'Família e Sucessões', etapa: 'proposta', proximoContato: addDias(h, -1), valorEstimado: 6000, descricao: 'Inventário extrajudicial.' });
  gravar('leads', { nome: 'Paulo Henrique', origem: 'Google', area: 'Trabalhista', etapa: 'perdido', motivoPerda: 'Achou os honorários altos' });
  const ph1 = gerarParcelas(3000, 6, addMeses(h, -2));
  ph1[0].pago = true; ph1[0].dataPagamento = ph1[0].vencimento; ph1[0].forma = 'PIX';
  gravar('honorarios', { clienteId: c1.id, processoId: p1.id, descricao: 'Honorários contratuais — ação contra descontos indevidos', tipo: 'Parcelado', percentualExito: 30, dataContrato: addDias(h, -20), parcelas: ph1 });
  gravar('honorarios', { clienteId: c3.id, processoId: '', descricao: 'Assessoria tributária mensal', tipo: 'Mensal (partido)', dataContrato: addMeses(h, -1), parcelas: gerarParcelas(4800, 3, addMeses(h, -1)) });
  toast('Dados de exemplo carregados');
  location.hash = '#/';
  render();
}

// ===== Ações (delegação de eventos) =====
const acoes = {
  fecharModal,
  novoCliente: () => formCliente(),
  editarCliente: (d) => formCliente(d.id),
  novoProcesso: (d) => formProcesso(null, { clienteId: d.cliente || '' }),
  editarProcesso: (d) => formProcesso(d.id),
  novoEvento: (d) => {
    const v = {};
    if (d.processo) { v.processoId = d.processo; v.clienteId = buscar('processos', d.processo)?.clienteId; }
    if (d.cliente) v.clienteId = d.cliente;
    if (d.data) v.data = d.data;
    if (d.titulo) { v.titulo = d.titulo; v.tipo = 'Prazo'; }
    formEvento(null, v);
  },
  editarEvento: (d) => formEvento(d.id),
  alternarEvento: (d, el) => {
    gravar('eventos', { id: d.id, concluido: el.checked });
    toast(el.checked ? 'Marcado como concluído' : 'Reaberto');
    render();
  },
  novoAtendimento: (d) => formRegistro('clientes', d.id, 'atendimentos', 'Registrar atendimento'),
  novoAndamento: (d) => formRegistro('processos', d.id, 'andamentos', 'Registrar andamento'),
  removerRegistro: (d) => {
    if (!confirm('Remover este registro?')) return;
    const obj = buscar(d.col, d.id);
    obj[d.lista] = (obj[d.lista] || []).filter((r) => r.id !== d.rid);
    salvar(); render();
  },
  novoLead: () => formLead(),
  editarLead: (d) => formLead(d.id),
  moverLead: (d) => {
    const l = buscar('leads', d.id);
    const i = ETAPAS.findIndex((e) => e.id === l.etapa) + Number(d.dir);
    if (i < 0 || i >= ETAPAS.length) return;
    gravar('leads', { id: d.id, etapa: ETAPAS[i].id });
    render();
  },
  converterLead: (d) => converterLead(d.id),
  novoHonorario: (d) => formHonorario(null, { clienteId: d.cliente || '', processoId: d.processo || '' }),
  editarHonorario: (d) => formHonorario(d.id),
  novaParcela: (d) => formParcela(d.hid),
  editarParcela: (d) => formParcela(d.hid, d.pid),
  pagarParcela: (d) => {
    const p = buscar('honorarios', d.hid).parcelas.find((x) => x.id === d.pid);
    Object.assign(p, { pago: true, dataPagamento: hoje() });
    salvar(); toast(`Recebimento de ${fmtMoeda(p.valor)} registrado`); render();
  },
  estornarParcela: (d) => {
    const p = buscar('honorarios', d.hid).parcelas.find((x) => x.id === d.pid);
    Object.assign(p, { pago: false, dataPagamento: '' });
    salvar(); render();
  },
  copiar: (d) => navigator.clipboard?.writeText(d.texto).then(() => toast('Copiado')),
  exportarBackup,
  importarBackup: () => $('#arquivo-backup').click(),
  exportarCSV,
  exportarICS,
  carregarExemplo,
  apagarTudo: () => {
    if (!confirm('Apagar TODOS os dados deste navegador? Faça um backup antes.')) return;
    if (prompt('Para confirmar, digite APAGAR') !== 'APAGAR') return;
    db = vazio(); salvar(); toast('Dados apagados'); location.hash = '#/'; render();
  },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-acao]');
  if (!el) return;
  const fn = acoes[el.dataset.acao];
  if (!fn) return;
  if (el.type !== 'checkbox') e.preventDefault();
  fn(el.dataset, el, e);
});

document.addEventListener('input', (e) => {
  const chave = e.target.dataset?.filtro;
  if (chave) {
    const [v, k] = chave.split('.');
    filtros[v][k] = e.target.value;
    if (telaAtual?.lista) $('#lista').innerHTML = telaAtual.lista();
    return;
  }
  const m = e.target.dataset?.mascara;
  if (m && MASCARAS[m]) e.target.value = MASCARAS[m](e.target.value);
});

// Arrastar e soltar no funil de leads
document.addEventListener('dragstart', (e) => {
  const card = e.target.closest?.('[data-lead]');
  if (card) e.dataTransfer.setData('text/plain', card.dataset.lead);
});
document.addEventListener('dragover', (e) => {
  const col = e.target.closest?.('.kanban-col');
  if (!col) return;
  e.preventDefault();
  document.querySelectorAll('.kanban-col.sobre').forEach((c) => c !== col && c.classList.remove('sobre'));
  col.classList.add('sobre');
});
document.addEventListener('drop', (e) => {
  const col = e.target.closest?.('.kanban-col');
  if (!col) return;
  e.preventDefault();
  const id = e.dataTransfer.getData('text/plain');
  if (id && buscar('leads', id)) { gravar('leads', { id, etapa: col.dataset.etapa }); render(); }
});
document.addEventListener('dragend', () => document.querySelectorAll('.kanban-col.sobre').forEach((c) => c.classList.remove('sobre')));

document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden) fecharModal(); });
$('#modal').addEventListener('mousedown', (e) => { if (e.target.id === 'modal') fecharModal(); });
$('#btn-menu').addEventListener('click', () => document.body.classList.toggle('menu-aberto'));
$('#fundo-menu').addEventListener('click', () => document.body.classList.remove('menu-aberto'));

// ===== Roteamento =====
const ROTAS = {
  '': telaPainel, clientes: telaClientes, cliente: telaCliente, processos: telaProcessos, processo: telaProcesso,
  agenda: telaAgenda, leads: telaLeads, financeiro: telaFinanceiro, honorario: telaHonorario, config: telaConfig,
};
const MENU_DE = { cliente: 'clientes', processo: 'processos', honorario: 'financeiro' };
let telaAtual = null;
let aposNavegar = null; // ação a executar depois da próxima troca de página

function render() {
  const [, rota = '', id] = location.hash.split('/');
  const tela = (ROTAS[rota] || telaNaoEncontrado)(id && decodeURIComponent(id));
  telaAtual = tela;
  $('#titulo-pagina').textContent = tela.titulo;
  document.title = `${tela.titulo} · CRM Jurídico`;
  $('#topo-acoes').innerHTML = tela.acoes || '';
  $('#nome-escritorio').textContent = db.meta.nomeEscritorio || 'Lopes Araújo';
  const rolagem = window.scrollY;
  $('#conteudo').innerHTML = tela.html;
  if (tela.lista) $('#lista').innerHTML = tela.lista();
  tela.depois?.();
  const menu = MENU_DE[rota] ?? rota;
  document.querySelectorAll('.menu nav a').forEach((a) => a.classList.toggle('ativo', a.dataset.rota === menu));
  if (render.ultimaRota === location.hash) window.scrollTo(0, rolagem);
  render.ultimaRota = location.hash;
}

window.addEventListener('hashchange', () => {
  if (!$('#modal').hidden) fecharModal();
  document.body.classList.remove('menu-aberto');
  window.scrollTo(0, 0);
  render();
  if (aposNavegar) { const fn = aposNavegar; aposNavegar = null; fn(); }
});
// Sincroniza se o CRM estiver aberto em outra aba
window.addEventListener('storage', (e) => { if (e.key === CHAVE) { db = carregar(); render(); } });
render();

// ===== App instalável (PWA) =====
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service worker não registrado', e));
}
let pedidoInstalacao = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  pedidoInstalacao = e;
  $('#btn-instalar').hidden = false;
});
$('#btn-instalar').addEventListener('click', async () => {
  if (!pedidoInstalacao) return;
  pedidoInstalacao.prompt();
  await pedidoInstalacao.userChoice;
  pedidoInstalacao = null;
  $('#btn-instalar').hidden = true;
});
window.addEventListener('appinstalled', () => { $('#btn-instalar').hidden = true; toast('App instalado'); });
