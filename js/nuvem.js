'use strict';

/* =====================================================================
 * Sincronização com o banco online (Supabase).
 * O app continua trabalhando sobre o objeto `db` em memória (js/app.js);
 * a cada salvar() este módulo compara cada registro com a última versão
 * enviada e envia só o que mudou. Sem internet, as mudanças ficam
 * guardadas no aparelho e seguem quando a conexão voltar.
 * ===================================================================== */

const SUPABASE_URL = 'https://mfrnzjexxuityhbqwzpd.supabase.co';
// Chave pública (publishable): pode ficar no código. Quem protege os dados é o login + RLS do banco.
const SUPABASE_CHAVE = 'sb_publishable_14MI7aQK5Sbu4UzuS-EIKA_S6ChQkwH';
const CHAVE_SYNC = 'crm-juridico-sync-v1';

// Coleção do app → tabela do banco. Campos: [nome no app, coluna, tipo, valor padrão]
// Tipos: t = texto, d = data, r = referência (id), n = número, b = sim/não, j = lista (jsonb)
const MAPA = {
  clientes: {
    tabela: 'clientes',
    campos: [['tipo', 'tipo', 't', 'PF'], ['nome', 'nome', 't'], ['documento', 'documento', 't'], ['telefone', 'telefone', 't'],
      ['email', 'email', 't'], ['nascimento', 'nascimento', 'd'], ['profissao', 'profissao', 't'], ['origem', 'origem', 't'],
      ['endereco', 'endereco', 't'], ['observacoes', 'observacoes', 't'], ['atendimentos', 'atendimentos', 'j']],
  },
  processos: {
    tabela: 'casos',
    campos: [['clienteId', 'cliente_id', 'r'], ['numero', 'numero', 't'], ['area', 'area', 't'], ['tipoAcao', 'tipo_acao', 't'],
      ['polo', 'polo', 't'], ['parteContraria', 'parte_contraria', 't'], ['funcao', 'funcao', 't'], ['admissao', 'admissao', 'd'],
      ['saida', 'saida', 'd'], ['ultimoSalario', 'ultimo_salario', 'n'], ['motivoSaida', 'motivo_saida', 't'],
      ['tribunal', 'tribunal', 't'], ['vara', 'vara', 't'], ['comarca', 'comarca', 't'], ['status', 'status', 't', 'Ativo'],
      ['fase', 'fase', 't'], ['valorCausa', 'valor_causa', 'n'], ['distribuicao', 'distribuicao', 'd'], ['link', 'link', 't'],
      ['observacoes', 'observacoes', 't'], ['andamentos', 'andamentos', 'j']],
  },
  leads: {
    tabela: 'leads',
    campos: [['nome', 'nome', 't'], ['telefone', 'telefone', 't'], ['email', 'email', 't'], ['origem', 'origem', 't'],
      ['area', 'area', 't'], ['etapa', 'etapa', 't', 'novo'], ['empresa', 'empresa', 't'], ['dataSaida', 'data_saida', 'd'],
      ['valorEstimado', 'valor_estimado', 'n'], ['proximoContato', 'proximo_contato', 'd'], ['motivoPerda', 'motivo_perda', 't'],
      ['descricao', 'descricao', 't'], ['clienteId', 'cliente_id', 'r']],
  },
  eventos: {
    tabela: 'prazos',
    campos: [['tipo', 'tipo', 't', 'Prazo'], ['prioridade', 'prioridade', 't', 'Normal'], ['titulo', 'titulo', 't'], ['data', 'data', 'd'],
      ['hora', 'hora', 't'], ['processoId', 'caso_id', 'r'], ['clienteId', 'cliente_id', 'r'], ['local', 'local', 't'],
      ['observacoes', 'observacoes', 't'], ['concluido', 'concluido', 'b']],
  },
  honorarios: {
    tabela: 'contratos',
    campos: [['clienteId', 'cliente_id', 'r'], ['processoId', 'caso_id', 'r'], ['descricao', 'descricao', 't'], ['tipo', 'tipo', 't'],
      ['percentualExito', 'percentual_exito', 'n'], ['dataContrato', 'data_contrato', 'd'], ['observacoes', 'observacoes', 't'],
      ['parcelas', 'parcelas', 'j']],
  },
};
// Pais antes dos filhos (inserção); a exclusão usa a ordem inversa.
const ORDEM = ['clientes', 'processos', 'leads', 'eventos', 'honorarios'];

function paraLinha(col, obj) {
  if (!obj.criadoEm) obj.criadoEm = new Date().toISOString();
  const linha = { id: obj.id, criado_em: obj.criadoEm };
  for (const [js, coluna, tipo, padrao] of MAPA[col].campos) {
    const v = obj[js];
    if (tipo === 'n') linha[coluna] = v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v);
    else if (tipo === 'b') linha[coluna] = Boolean(v);
    else if (tipo === 'j') linha[coluna] = Array.isArray(v) ? v : [];
    else linha[coluna] = (v == null || v === '' ? padrao ?? null : String(v));
  }
  return linha;
}

function deLinha(col, linha) {
  const obj = { id: linha.id, criadoEm: linha.criado_em, atualizadoEm: linha.atualizado_em };
  for (const [js, coluna, tipo] of MAPA[col].campos) {
    const v = linha[coluna];
    if (tipo === 'n') obj[js] = v == null ? null : Number(v);
    else if (tipo === 'b') obj[js] = Boolean(v);
    else if (tipo === 'j') obj[js] = Array.isArray(v) ? v : [];
    else obj[js] = v ?? '';
  }
  return obj;
}

const nuvem = {
  cliente: null, usuario: null, alvo: null, snap: null, timer: null,
  emCurso: false, pendente: false, ultimaAtualizacao: 0,
};
const snapVazio = () => Object.fromEntries(ORDEM.map((c) => [c, {}]));
const assinatura = (col, obj) => JSON.stringify(paraLinha(col, obj));

function lerSnap() {
  try { return JSON.parse(localStorage.getItem(CHAVE_SYNC)); } catch { return null; }
}
function gravarSnap() {
  try { localStorage.setItem(CHAVE_SYNC, JSON.stringify({ usuario: nuvem.usuario.id, snap: nuvem.snap })); } catch { /* sem espaço: segue só em memória */ }
}
function temPendencias(snap) {
  return ORDEM.some((col) => {
    const ids = new Set(db[col].map((o) => o.id));
    return Object.keys(snap[col] || {}).some((id) => !ids.has(id))
      || db[col].some((o) => snap[col]?.[o.id] !== assinatura(col, o));
  });
}

// ===== Indicador de estado no menu =====
function mostrarEstado(estado, detalhe = '') {
  const el = document.getElementById('estado-nuvem');
  if (!el) return;
  const textos = {
    ok: '☁ Salvo no banco online',
    salvando: '⟳ Salvando…',
    offline: '⚠ Sem internet — as alterações serão enviadas depois',
    erro: '⚠ Erro ao salvar online — tentaremos de novo',
    local: 'Dados salvos neste aparelho',
  };
  el.textContent = textos[estado] || estado;
  el.title = detalhe;
  el.dataset.estado = estado;
}

// ===== Envio das alterações =====
function aoSalvar() {
  if (!nuvem.usuario || !nuvem.snap) return;
  mostrarEstado('salvando');
  clearTimeout(nuvem.timer);
  nuvem.timer = setTimeout(sincronizar, 500);
}

async function sincronizar() {
  if (!nuvem.usuario || !nuvem.snap) return;
  if (nuvem.emCurso) { nuvem.pendente = true; return; }
  nuvem.emCurso = true;
  try {
    for (const col of [...ORDEM].reverse()) {
      const ids = new Set(db[col].map((o) => o.id));
      const sumidos = Object.keys(nuvem.snap[col]).filter((id) => !ids.has(id));
      if (!sumidos.length) continue;
      const { error } = await nuvem.cliente.from(MAPA[col].tabela).delete().in('id', sumidos);
      if (error) throw error;
      sumidos.forEach((id) => delete nuvem.snap[col][id]);
      gravarSnap();
    }
    for (const col of ORDEM) {
      const mudados = [];
      for (const o of db[col]) {
        const linha = paraLinha(col, o);
        const sig = JSON.stringify(linha);
        if (nuvem.snap[col][o.id] !== sig) mudados.push([linha, sig]);
      }
      if (!mudados.length) continue;
      const { error } = await nuvem.cliente.from(MAPA[col].tabela).upsert(mudados.map(([l]) => l));
      if (error) throw error;
      mudados.forEach(([l, sig]) => { nuvem.snap[col][l.id] = sig; });
      gravarSnap();
    }
    mostrarEstado('ok');
  } catch (e) {
    console.error('Falha ao sincronizar', e);
    mostrarEstado(navigator.onLine ? 'erro' : 'offline', e.message || String(e));
  } finally {
    nuvem.emCurso = false;
    if (nuvem.pendente) { nuvem.pendente = false; sincronizar(); }
  }
}

// ===== Download dos dados =====
async function baixarTabela(tabela) {
  const linhas = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await nuvem.cliente.from(tabela).select('*').order('criado_em').range(de, de + 999);
    if (error) throw error;
    linhas.push(...data);
    if (data.length < 1000) return linhas;
  }
}
async function baixarTudo() {
  const tabelas = await Promise.all(ORDEM.map((col) => baixarTabela(MAPA[col].tabela)));
  const remoto = {};
  const snap = snapVazio();
  ORDEM.forEach((col, i) => {
    remoto[col] = tabelas[i].map((linha) => {
      const o = deLinha(col, linha);
      snap[col][o.id] = assinatura(col, o);
      return o;
    });
  });
  return { remoto, snap };
}
function aplicar({ remoto, snap }) {
  db = { ...vazio(), ...remoto, meta: db.meta || {} };
  nuvem.snap = snap;
  nuvem.ultimaAtualizacao = Date.now();
  try { localStorage.setItem(CHAVE, JSON.stringify(db)); } catch { /* segue em memória */ }
  gravarSnap();
  mostrarEstado('ok');
  render();
}
const contar = (dados) => ORDEM.reduce((t, c) => t + (dados[c]?.length || 0), 0);

async function iniciarSessao(usuario) {
  nuvem.usuario = usuario;
  esconderLogin();
  const salvo = lerSnap();
  const mesmoUsuario = salvo && salvo.usuario === usuario.id;
  // Dados locais de outra conta não podem vazar para esta.
  if (salvo && !mesmoUsuario) db = vazio();
  mostrarEstado('salvando');
  try {
    if (mesmoUsuario) {
      nuvem.snap = salvo.snap;
      if (temPendencias(nuvem.snap)) await sincronizar(); // envia o que foi feito offline antes de recarregar
      aplicar(await baixarTudo());
      return;
    }
    const baixado = await baixarTudo();
    const locais = contar(db);
    if (locais && !contar(baixado.remoto)) {
      if (confirm(`Este aparelho tem ${locais} registro(s) salvos. Enviar para o banco online?\n\nSe cancelar, eles continuam guardados neste aparelho, mas não aparecem no CRM online.`)) {
        nuvem.snap = snapVazio();
        gravarSnap();
        await sincronizar();
        aplicar(await baixarTudo());
        toast('Dados enviados para o banco online');
        return;
      }
      try { localStorage.setItem(`${CHAVE}-copia-local`, JSON.stringify(db)); } catch { /* ignora */ }
    } else if (locais) {
      const remotos = new Set(ORDEM.flatMap((c) => baixado.remoto[c].map((o) => o.id)));
      const extras = ORDEM.flatMap((c) => db[c].filter((o) => !remotos.has(o.id)).map((o) => [c, o]));
      if (extras.length && confirm(`Este aparelho tem ${extras.length} registro(s) que não estão no banco online. Juntar com os dados online?`)) {
        extras.forEach(([c, o]) => baixado.remoto[c].push(o));
        aplicar(baixado);
        await sincronizar();
        return;
      }
    }
    aplicar(baixado);
  } catch (e) {
    console.error('Falha ao carregar do banco', e);
    // Sem internet: segue com a cópia do aparelho e envia quando voltar.
    nuvem.snap = mesmoUsuario ? salvo.snap : snapVazio();
    gravarSnap();
    mostrarEstado('offline', e.message || String(e));
    render();
  }
}

async function atualizarDoServidor() {
  if (!nuvem.usuario || nuvem.emCurso || Date.now() - nuvem.ultimaAtualizacao < 30000) return;
  if (temPendencias(nuvem.snap)) { sincronizar(); return; }
  try { aplicar(await baixarTudo()); } catch { /* sem internet: mantém o que está na tela */ }
}

// ===== Tela de login =====
function montarLogin() {
  if (document.getElementById('tela-login')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div id="tela-login" class="tela-login" hidden>
      <form id="form-login" class="login-caixa" novalidate>
        <div class="login-marca">
          <img src="icons/icon-192.png" alt="" width="56" height="56">
          <div><strong>CRM Jurídico</strong><span id="login-escritorio">${esc(db.meta?.nomeEscritorio || 'Lopes Araújo')}</span></div>
        </div>
        <h2 id="login-titulo">Entrar</h2>
        <label class="campo"><span>E-mail</span><input type="email" name="email" required autocomplete="username"></label>
        <label class="campo"><span>Senha</span><input type="password" name="senha" required minlength="8" autocomplete="current-password"></label>
        <button class="btn primario" type="submit" id="login-enviar">Entrar</button>
        <div class="login-links">
          <button type="button" class="btn-link" id="login-alternar">Primeiro acesso? Criar conta</button>
          <button type="button" class="btn-link" id="login-esqueci">Esqueci a senha</button>
        </div>
        <p id="login-msg" class="login-msg" role="status"></p>
      </form>
    </div>`);
  let criando = false;
  const form = document.getElementById('form-login');
  const msg = (t, erro = false) => { const el = document.getElementById('login-msg'); el.textContent = t; el.classList.toggle('erro', erro); };
  document.getElementById('login-alternar').addEventListener('click', () => {
    criando = !criando;
    document.getElementById('login-titulo').textContent = criando ? 'Criar conta' : 'Entrar';
    document.getElementById('login-enviar').textContent = criando ? 'Criar conta' : 'Entrar';
    document.getElementById('login-alternar').textContent = criando ? 'Já tenho conta — entrar' : 'Primeiro acesso? Criar conta';
    form.elements.senha.autocomplete = criando ? 'new-password' : 'current-password';
    msg('');
  });
  document.getElementById('login-esqueci').addEventListener('click', async () => {
    const email = form.elements.email.value.trim();
    if (!email) { msg('Digite seu e-mail acima e clique de novo em "Esqueci a senha".', true); return; }
    const { error } = await nuvem.cliente.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    msg(error ? `Não foi possível enviar: ${error.message}` : 'Enviamos um link para redefinir a senha. Confira seu e-mail.', Boolean(error));
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const email = form.elements.email.value.trim();
    const password = form.elements.senha.value;
    const botao = document.getElementById('login-enviar');
    botao.disabled = true;
    msg(criando ? 'Criando conta…' : 'Entrando…');
    try {
      if (criando) {
        const { data, error } = await nuvem.cliente.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } });
        if (error) throw error;
        if (!data.session) msg('Conta criada! Abra o e-mail de confirmação que enviamos e depois entre aqui.');
      } else {
        const { error } = await nuvem.cliente.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      const traducoes = {
        'Invalid login credentials': 'E-mail ou senha incorretos.',
        'Email not confirmed': 'Confirme seu e-mail antes de entrar (veja a caixa de entrada e o spam).',
        'User already registered': 'Este e-mail já tem conta. Use "Entrar".',
      };
      msg(traducoes[err.message] || `Erro: ${err.message}`, true);
    } finally {
      botao.disabled = false;
    }
  });
}
function mostrarLogin() {
  montarLogin();
  document.getElementById('tela-login').hidden = false;
  document.body.classList.add('sem-sessao');
  mostrarEstado('local');
}
function esconderLogin() {
  const el = document.getElementById('tela-login');
  if (el) el.hidden = true;
  document.body.classList.remove('sem-sessao');
}

async function sair() {
  if (nuvem.snap && temPendencias(nuvem.snap) && !confirm('Há alterações que ainda não chegaram ao banco online (sem internet?). Se sair agora, elas serão perdidas. Sair mesmo assim?')) return;
  await nuvem.cliente.auth.signOut();
  // Limpa a cópia local: num aparelho compartilhado, ninguém vê os dados depois de sair.
  [CHAVE, CHAVE_SYNC].forEach((k) => { try { localStorage.removeItem(k); } catch { /* ignora */ } });
  nuvem.usuario = null;
  nuvem.snap = null;
  db = vazio();
  render();
  mostrarLogin();
}

// ===== Inicialização =====
(async function iniciarNuvem() {
  const rodape = document.querySelector('.menu-rodape');
  if (rodape) {
    rodape.insertAdjacentHTML('beforeend', `
      <div id="conta" class="conta" hidden><span id="conta-email"></span> · <button type="button" class="btn-link" id="btn-sair">Sair</button></div>`);
    document.getElementById('btn-sair').addEventListener('click', sair);
  }
  if (!window.supabase?.createClient) { mostrarEstado('local'); return; } // biblioteca indisponível: modo só local
  nuvem.cliente = window.supabase.createClient(SUPABASE_URL, SUPABASE_CHAVE, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  nuvem.cliente.auth.onAuthStateChange((evento, sessao) => {
    if (evento === 'PASSWORD_RECOVERY') {
      setTimeout(async () => {
        const nova = prompt('Digite a nova senha (mínimo 8 caracteres):');
        if (!nova) return;
        const { error } = await nuvem.cliente.auth.updateUser({ password: nova });
        toast(error ? `Erro: ${error.message}` : 'Senha alterada', error ? 'erro' : '');
      }, 0);
    }
    const conta = document.getElementById('conta');
    if (conta) {
      conta.hidden = !sessao;
      document.getElementById('conta-email').textContent = sessao?.user?.email || '';
    }
    // Entrou agora (ou trocou de conta) → carrega os dados desta conta.
    if (sessao?.user && nuvem.alvo !== sessao.user.id) {
      nuvem.alvo = sessao.user.id;
      setTimeout(() => iniciarSessao(sessao.user), 0);
    }
    if (evento === 'SIGNED_OUT') { nuvem.alvo = null; if (nuvem.usuario) { nuvem.usuario = null; mostrarLogin(); } }
  });
  const { data } = await nuvem.cliente.auth.getSession();
  if (!data.session) mostrarLogin();

  window.addEventListener('online', () => sincronizar());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') atualizarDoServidor(); });
})();
