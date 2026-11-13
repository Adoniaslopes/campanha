'use strict';
/* Reunião por voz dentro do escritório (versão do navegador, app.html).
 * Usa o agente de voz do escritório no ElevenLabs (Harvey e equipe): o Dr. toca em "Falar"
 * e conversa à vontade; a fala aparece na mesa, quem está falando acende e tudo fica guardado na sala. */
(() => {
  const AGENTE = 'agent_4301m795s4z6e06arr6830nmtw3p';
  const btn = document.getElementById('btn-falar-cel');
  if (!btn || !window.ElevenConversation) return;
  let conversa = null;
  let quemFala = 'claude';
  const idPorNome = () => Object.fromEntries(Object.entries(window.TIME || {}).map(([id, p]) => [String(p.nome || '').toLowerCase(), id]));
  function detectarQuem(texto) {
    const m = String(texto).match(/^\s*(?:aqui (?:é|e) (?:o|a)\s+|(?:o|a)\s+)?([A-Za-zÀ-ú]+)(?:\s+falando|,|\s+aqui)?/i);
    const nomes = idPorNome();
    const n = m ? m[1].toLowerCase() : '';
    if (nomes[n] && /aqui (é|e)|falando/i.test(String(texto).slice(0, 40))) return nomes[n];
    return quemFala;
  }
  function acender(id) {
    document.querySelectorAll('.assento').forEach((b) => b.classList.toggle('falando', Boolean(id) && b.dataset.chamar === id));
  }
  function status(t) { const a = document.getElementById('aviso-voz'); if (a) a.textContent = t; }
  const opcoes = (tipo) => ({
    agentId: AGENTE,
    connectionType: tipo,
    onConnect: () => { window.__estadoOrbe?.('ouvindo'); btn.disabled = false; btn.textContent = '■ Encerrar reunião'; status('Reunião aberta: pode falar normalmente. Chame pelo nome para falar com alguém.'); },
    onDisconnect: () => { window.__estadoOrbe?.('livre'); conversa = null; acender(null); btn.disabled = false; btn.textContent = '🎙 Falar com a equipe'; },
    onError: (m) => { status('Voz: ' + (m || 'erro na conexão')); },
    onModeChange: ({ mode }) => { window.__estadoOrbe?.(mode === 'speaking' ? 'falando' : 'ouvindo'); if (mode === 'listening') acender(null); else acender(quemFala); },
    onMessage: ({ message, source, role }) => {
      const ia = (role || source) === 'ai' || (role || source) === 'agent';
      const texto = String(message || '').trim();
      if (!texto) return;
      if (ia) { quemFala = detectarQuem(texto); acender(quemFala); }
      const quem = ia ? quemFala : 'dr';
      try { legenda(ia ? nomeDe(quem) : 'Você', texto, ia ? '' : 'voce'); } catch { /* sem legenda */ }
      try { salvar('sala', { id: uid('msg'), quem, texto, criadoEm: agoraISO(), voz: true }).catch(() => {}); } catch { /* sem banco */ }
    },
  });
  const descrever = (e) => [e?.name, e?.message || (typeof e === 'string' ? e : '')].filter(Boolean).join(': ') || String(e);
  async function iniciar() {
    btn.disabled = true; btn.textContent = 'Conectando…'; window.__estadoOrbe?.('conectando');
    const voltar = (msg) => { conversa = null; window.__estadoOrbe?.('livre'); btn.disabled = false; btn.textContent = '🎙 Falar com a equipe'; status(msg); };
    // 1) Pede o microfone primeiro, para o navegador mostrar o pedido de permissão.
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((t) => t.stop());
    } catch (e) {
      voltar(e?.name === 'NotAllowedError'
        ? 'O navegador bloqueou o microfone para este site. No Chrome: toque no ícone à esquerda do endereço → Permissões → Microfone → Permitir, e recarregue a página. (' + descrever(e) + ')'
        : 'Não consegui abrir o microfone: ' + descrever(e));
      return;
    }
    status('Microfone liberado. Conectando com a equipe…');
    // 2) Abre a conversa (WebRTC; se falhar, tenta pelo WebSocket).
    try {
      conversa = await window.ElevenConversation.startSession(opcoes('webrtc'));
    } catch (e1) {
      try { conversa = await window.ElevenConversation.startSession(opcoes('websocket')); }
      catch (e2) { voltar('Não consegui conectar com a equipe: ' + descrever(e2) + ' (antes: ' + descrever(e1) + ')'); }
    }
  }
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#btn-falar-cel')) return;
    e.stopImmediatePropagation(); e.preventDefault();
    if (conversa) conversa.endSession(); else iniciar();
  }, true);
  // Esfera de voz no centro da mesa: tocar nela abre ou encerra a reunião.
  const orbe = document.createElement('button');
  orbe.type = 'button'; orbe.className = 'orbe-voz'; orbe.setAttribute('aria-label', 'Falar com a equipe');
  orbe.innerHTML = '<span class="orbe-bola"></span><span class="orbe-txt">Toque para falar</span>';
  document.querySelector('.mesa')?.appendChild(orbe);
  orbe.addEventListener('click', () => btn.click());
  const estadoOrbe = (e) => { orbe.dataset.estado = e; orbe.querySelector('.orbe-txt').textContent = { livre: 'Toque para falar', conectando: 'Conectando…', ouvindo: 'Ouvindo…', falando: '' }[e] ?? ''; };
  estadoOrbe('livre');
  window.__estadoOrbe = estadoOrbe;
  const mostrar = () => { btn.hidden = false; btn.textContent = '🎙 Falar com a equipe'; status('Toque em “Falar com a equipe” e converse por voz, como numa reunião.'); };
  // espera o escritorio.js montar a sala
  setTimeout(mostrar, 1500);
})();
