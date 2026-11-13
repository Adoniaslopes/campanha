'use strict';
/* Versão do navegador (app.html): a esfera criada pelo escritorio.js acompanha o botão "Falar"
 * (reconhecimento de voz do Chrome) e mostra a versão carregada. */
(() => {
  const VERSAO = '202611132309';
  const btn = document.getElementById('btn-falar-cel');
  if (!btn) return;
  new MutationObserver(() => {
    if (typeof orbe !== 'function') return;
    if (/Parar|Enviar/.test(btn.textContent)) orbe('voce'); else orbe(null);
  }).observe(btn, { childList: true, characterData: true, subtree: true });
  setTimeout(() => {
    const a = document.getElementById('aviso-voz');
    if (a && !btn.hidden) a.textContent = 'Toque na esfera e fale. Quando o senhor parar, a mensagem vai sozinha. (versão ' + VERSAO + ')';
  }, 1500);
})();
