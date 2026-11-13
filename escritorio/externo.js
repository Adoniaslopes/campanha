'use strict';
/* =====================================================================
 * Escritório fora do claude.ai (GitHub Pages / navegador do celular).
 * Recria o window.claude.use() que o escritorio.js espera, usando:
 *  - db     → tabela escritorio_docs do Supabase (login + RLS: só membros)
 *  - sample → função "equipe" do Supabase (API da Anthropic)
 *  - tts    → função "voz" do Supabase (ElevenLabs); sem chave, usa as vozes do navegador
 *  - dictation → null: o escritorio.js usa o botão "Falar" com o reconhecimento de voz do navegador
 * Só é carregado pela página app.html; dentro do claude.ai nada disto roda.
 * ===================================================================== */
(() => {
  if (typeof window.claude?.use === 'function') return;
  const URL_SB = 'https://mfrnzjexxuityhbqwzpd.supabase.co';
  const CHAVE_SB = 'sb_publishable_14MI7aQK5Sbu4UzuS-EIKA_S6ChQkwH'; // chave pública: quem protege os dados é o login + RLS
  const sb = window.supabase.createClient(URL_SB, CHAVE_SB, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  window.__sb = sb;

  // ---------- Login ----------
  let liberar;
  const logado = new Promise((r) => { liberar = r; });
  function telaLogin(msg = '') {
    let t = document.getElementById('login-externo');
    if (!t) {
      t = document.createElement('div');
      t.id = 'login-externo';
      t.innerHTML = `<form class="login-caixa">
        <h2>Lopes Araújo <span>Advocacia</span></h2>
        <p>Escritório Digital — acesso restrito</p>
        <input type="email" name="email" placeholder="E-mail" autocomplete="username" required>
        <input type="password" name="senha" placeholder="Senha (mínimo 6 caracteres)" autocomplete="current-password" minlength="6" required>
        <button type="submit">Entrar</button>
        <small class="login-msg"></small>
        <small class="login-dica">No primeiro acesso, o e-mail e a senha digitados criam o seu acesso.</small>
      </form>`;
      document.body.appendChild(t);
      t.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target; const email = f.email.value.trim(); const senha = f.senha.value;
        const m = t.querySelector('.login-msg'); m.textContent = 'Entrando…';
        let { error } = await sb.auth.signInWithPassword({ email, password: senha });
        if (error && /invalid login credentials/i.test(error.message)) {
          const cad = await sb.auth.signUp({ email, password: senha });
          if (cad.error && !/already registered/i.test(cad.error.message)) { m.textContent = 'Não foi possível criar o acesso: ' + cad.error.message; return; }
          ({ error } = await sb.auth.signInWithPassword({ email, password: senha }));
          if (error && /already registered/i.test(cad.error?.message || '')) { m.textContent = 'Senha incorreta.'; return; }
        }
        if (error) { m.textContent = /not confirmed/i.test(error.message) ? 'Acesso criado. Abra o link de confirmação enviado ao seu e-mail e depois entre aqui de novo.' : 'Não foi possível entrar: ' + error.message; return; }
        await conferir();
      });
    }
    t.hidden = false;
    t.querySelector('.login-msg').textContent = msg;
  }
  async function conferir() {
    const { data } = await sb.auth.getSession();
    if (!data.session) { telaLogin(); return; }
    const { data: m, error } = await sb.from('escritorio_membros').select('email');
    if (error || !m?.length) { await sb.auth.signOut(); telaLogin('Este e-mail não tem acesso ao escritório.'); return; }
    const t = document.getElementById('login-externo'); if (t) t.hidden = true;
    liberar();
  }
  document.addEventListener('DOMContentLoaded', conferir);
  window.sairDoEscritorio = async () => { await sb.auth.signOut(); location.reload(); };

  // ---------- Banco (mesma forma do db do claude.ai) ----------
  const ouvintes = {}; // caminho → [funções de atualização]
  const avisar = (caminho) => (ouvintes[caminho] || []).forEach((f) => f());
  function docRef(caminho, id) {
    return {
      id,
      async set(dados) {
        const { error } = await sb.from('escritorio_docs').upsert({ colecao: caminho, doc_id: id, dados, atualizado: new Date().toISOString() });
        if (error) throw { code: 'db', message: error.message };
        avisar(caminho);
      },
      async get() {
        const { data, error } = await sb.from('escritorio_docs').select('dados').eq('colecao', caminho).eq('doc_id', id).maybeSingle();
        if (error) throw { code: 'db', message: error.message };
        return { id, exists: Boolean(data), data: () => data?.dados };
      },
      async delete() {
        const { error } = await sb.from('escritorio_docs').delete().eq('colecao', caminho).eq('doc_id', id);
        if (error) throw { code: 'db', message: error.message };
        avisar(caminho);
      },
    };
  }
  function colRef(caminho, ordem, direcao, limite) {
    return {
      doc: (id) => docRef(caminho, id),
      orderBy: (campo, dir) => colRef(caminho, campo, dir, limite),
      limit: (n) => colRef(caminho, ordem, direcao, n),
      onSnapshot(proximo, falha) {
        let ultimo = '';
        const ler = async () => {
          try {
            let q = sb.from('escritorio_docs').select('doc_id,dados').eq('colecao', caminho);
            if (ordem) q = q.order(`dados->>${ordem}`, { ascending: direcao !== 'desc' });
            if (limite) q = q.limit(limite);
            const { data, error } = await q;
            if (error) throw error;
            const assinatura = JSON.stringify(data);
            if (assinatura === ultimo) return;
            ultimo = assinatura;
            const docs = data.map((r) => ({ id: r.doc_id, exists: true, data: () => r.dados }));
            proximo({ docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} });
          } catch (e) { falha?.(e); }
        };
        (ouvintes[caminho] ||= []).push(ler);
        ler();
        const t = setInterval(() => { if (!document.hidden) ler(); }, 6000);
        return () => { clearInterval(t); ouvintes[caminho] = (ouvintes[caminho] || []).filter((f) => f !== ler); };
      },
    };
  }
  const db = { doc: (caminho) => ({ collection: (c) => colRef(`${caminho}/${c}`) }), collection: (c) => colRef(c) };

  // ---------- Inteligência da equipe (função "equipe") ----------
  async function chamarEquipe(corpo, signal) {
    const { data: s } = await sb.auth.getSession();
    const r = await fetch(`${URL_SB}/functions/v1/equipe`, {
      method: 'POST', signal,
      headers: { 'Content-Type': 'application/json', apikey: CHAVE_SB, Authorization: `Bearer ${s.session?.access_token}` },
      body: JSON.stringify(corpo),
    }).catch((e) => { throw { code: e?.name === 'AbortError' ? 'cancelled' : 'upstream_error', message: 'Sem conexão com o servidor.' }; });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg = j?.erro || j?.error?.message || `erro ${r.status}`;
      throw { code: r.status === 503 ? 'sem_chave' : r.status === 429 ? 'rate_limited' : 'upstream_error', message: msg };
    }
    return j;
  }
  const textoDe = (r) => (r.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
  const sample = async (prompt, opts = {}) => ({ text: textoDe(await chamarEquipe({ messages: [{ role: 'user', content: prompt }] }, opts.signal)) });
  sample.limits = async () => ({ tools: { maxCount: 10 } });
  sample.json = async (prompt, opts = {}) => {
    const ferramentas = opts.tools || [];
    const tools = ferramentas.map((t) => ({ name: t.name, description: t.description, input_schema: t.inputSchema }));
    const msgs = [{ role: 'user', content: `${prompt}\n\nResponda somente com o objeto JSON pedido, sem nenhum texto fora dele.` }];
    for (let volta = 0; volta < 6; volta++) {
      const r = await chamarEquipe({ messages: msgs, tools }, opts.signal);
      msgs.push({ role: 'assistant', content: r.content });
      const usos = (r.content || []).filter((b) => b.type === 'tool_use');
      if (r.stop_reason !== 'tool_use' || !usos.length) {
        const m = textoDe(r).match(/\{[\s\S]*\}/);
        if (!m) throw { code: 'invalid_json', message: 'A resposta não veio no formato esperado.' };
        return JSON.parse(m[0]);
      }
      const resultados = [];
      for (const u of usos) {
        const f = ferramentas.find((x) => x.name === u.name);
        let saida;
        try { saida = f ? await f.execute(u.input || {}) : { erro: 'ferramenta desconhecida' }; } catch (e) { saida = { erro: String(e?.message || e) }; }
        resultados.push({ type: 'tool_result', tool_use_id: u.id, content: JSON.stringify(saida ?? null) });
      }
      msgs.push({ role: 'user', content: resultados });
    }
    throw { code: 'upstream_error', message: 'A equipe precisou de etapas demais.' };
  };

  // ---------- Vozes do ElevenLabs (função "voz") ----------
  const audio = new Audio();
  audio.preload = 'auto';
  let desbloqueado = false;
  // No celular, o áudio só toca depois de um toque na tela: o primeiro toque libera o player.
  document.addEventListener('pointerdown', () => {
    if (desbloqueado) return;
    desbloqueado = true;
    audio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRBqpAAAAAAAAAAAAAAAAAAAA//sQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
    audio.play().catch(() => {});
  }, { capture: true });
  let aoComecar = () => {};
  let parar = false;
  async function falarUma(l) {
    const { data: s } = await sb.auth.getSession();
    const r = await fetch(`${URL_SB}/functions/v1/voz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: CHAVE_SB, Authorization: `Bearer ${s.session?.access_token}` },
      body: JSON.stringify({ texto: l.text, voz: l.voice }),
    });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw { code: 'upstream_error', message: j.erro || `voz: erro ${r.status}` }; }
    const url = URL.createObjectURL(await r.blob());
    if (parar) { URL.revokeObjectURL(url); return; }
    await new Promise((resolve) => {
      audio.onended = audio.onerror = audio.onpause = () => { audio.onended = audio.onerror = audio.onpause = null; URL.revokeObjectURL(url); resolve(); };
      audio.src = url;
      aoComecar({ id: l.id });
      audio.play().catch(() => { resolve(); });
    });
  }
  const tts = {
    async speak(linhas) { parar = false; for (const l of linhas) { if (parar) break; await falarUma(l); } return { playedMs: 0 }; },
    async stop() { parar = true; audio.pause(); },
    onLine(f) { aoComecar = f; return () => { aoComecar = () => {}; }; },
    onState() { return () => {}; },
  };
  async function carregarVozesEleven() {
    const { data: s } = await sb.auth.getSession();
    const r = await fetch(`${URL_SB}/functions/v1/voz`, { headers: { apikey: CHAVE_SB, Authorization: `Bearer ${s.session?.access_token}` } }).catch(() => null);
    if (!r?.ok) return false;
    const lista = await r.json().catch(() => []);
    if (!Array.isArray(lista) || !lista.length) return false;
    window.VOZES_EXTERNAS = lista.map((v) => [v.id, v.nome]);
    window.VOZES_EXTERNAS_G = {
      m: lista.filter((v) => /^male/i.test(v.rotulos?.gender || '')).map((v) => v.id),
      f: lista.filter((v) => /^female/i.test(v.rotulos?.gender || '')).map((v) => v.id),
    };
    return true;
  }

  // ---------- Fotos guardadas no banco ----------
  async function carregarFotos() {
    const { data } = await sb.from('escritorio_docs').select('dados').eq('colecao', 'escritorio/dados/config').eq('doc_id', 'fotosdados').maybeSingle();
    if (data?.dados) window.FOTOS_DADOS = data.dados;
  }

  let pronto = null;
  const preparar = () => (pronto ||= logado.then(async () => { await Promise.all([carregarFotos().catch(() => {}), carregarVozesEleven().catch(() => false)]); }));
  // ---------- Transcrição do áudio gravado (função "ouvir", ElevenLabs) ----------
  async function transcrever(blob) {
    const { data: s } = await sb.auth.getSession();
    const r = await fetch(`${URL_SB}/functions/v1/ouvir`, {
      method: 'POST',
      headers: { 'Content-Type': blob.type || 'audio/webm', apikey: CHAVE_SB, Authorization: `Bearer ${s.session?.access_token}` },
      body: blob,
    }).catch(() => { throw { message: 'sem conexão com o servidor.' }; });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw { code: j.code || 'upstream_error', message: j.erro || `erro ${r.status}` };
    return j.texto || '';
  }

  window.claude = {
    externo: true,
    transcrever,
    async use(nome) {
      await preparar();
      if (nome === 'db') return db;
      if (nome === 'sample') return sample;
      if (nome === 'tts') return window.VOZES_EXTERNAS ? tts : null;
      return null; // dictation e assets: o escritorio.js usa as alternativas
    },
  };
})();
