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
  async function iniciar() {
    btn.disabled = true; btn.textContent = 'Conectando…';
    status('Permita o microfone quando o navegador pedir.');
    try {
      conversa = await window.ElevenConversation.startSession({
        agentId: AGENTE,
        connectionType: 'webrtc',
        onConnect: () => { btn.disabled = false; btn.textContent = '■ Encerrar reunião'; status('Reunião aberta: pode falar normalmente. Chame pelo nome para falar com alguém.'); },
        onDisconnect: () => { conversa = null; acender(null); btn.disabled = false; btn.textContent = '🎙 Falar com a equipe'; status('Reunião encerrada.'); },
        onError: (m) => { status('Voz: ' + (m || 'erro na conexão')); },
        onModeChange: ({ mode }) => { if (mode === 'listening') acender(null); else acender(quemFala); },
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
    } catch (e) {
      conversa = null; btn.disabled = false; btn.textContent = '🎙 Falar com a equipe';
      status(/permission|notallowed|denied/i.test(String(e?.name || e?.message || e))
        ? 'O microfone foi negado. Toque no cadeado ao lado do endereço, permita o microfone e tente de novo.'
        : 'Não consegui abrir a reunião por voz: ' + (e?.message || e));
    }
  }
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#btn-falar-cel')) return;
    e.stopImmediatePropagation(); e.preventDefault();
    if (conversa) conversa.endSession(); else iniciar();
  }, true);
  const mostrar = () => { btn.hidden = false; btn.textContent = '🎙 Falar com a equipe'; status('Toque em “Falar com a equipe” e converse por voz, como numa reunião.'); };
  // espera o escritorio.js montar a sala
  setTimeout(mostrar, 1500);
})();
