'use strict';
/* Esfera de voz no centro da mesa (versão do navegador, app.html).
 * Tocar na esfera é o mesmo que tocar em "Falar": o Chrome ouve, a mensagem vai para a equipe
 * e a equipe responde com as vozes do próprio aparelho. */
(() => {
  const VERSAO = '202611132226';
  const btn = document.getElementById('btn-falar-cel');
  const mesa = document.querySelector('.mesa');
  if (!btn || !mesa) return;
  const orbe = document.createElement('button');
  orbe.type = 'button'; orbe.className = 'orbe-voz'; orbe.setAttribute('aria-label', 'Falar com a equipe');
  orbe.innerHTML = '<span class="orbe-bola"></span><span class="orbe-txt">Toque para falar</span>';
  mesa.appendChild(orbe);
  orbe.addEventListener('click', () => btn.click());
  // acompanha o botão: "■ Parar" = ouvindo
  new MutationObserver(() => {
    const ouvindo = /Parar|Enviar/.test(btn.textContent);
    orbe.dataset.estado = ouvindo ? 'ouvindo' : 'livre';
    orbe.querySelector('.orbe-txt').textContent = ouvindo ? 'Ouvindo…' : 'Toque para falar';
  }).observe(btn, { childList: true, characterData: true, subtree: true });
  setTimeout(() => {
    const a = document.getElementById('aviso-voz');
    if (a && !btn.hidden) a.textContent = 'Toque na esfera e fale. Quando o senhor parar, a mensagem vai sozinha. (versão ' + VERSAO + ')';
  }, 1500);
})();
