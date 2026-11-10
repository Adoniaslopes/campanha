'use strict';

/* =====================================================================
 * Banco da própria página quando o CRM roda no claude.ai (capability db).
 * Cada registro é um documento em crm/escritorio/<coleção>/<id>; a regra
 * publicada com a página deixa só o dono ler e escrever em "crm".
 * Mesma ideia do js/nuvem.js: o app trabalha sobre `db` em memória e,
 * a cada salvar(), este módulo grava só o que mudou.
 * ===================================================================== */

(async function iniciarBancoClaude() {
  if (!EM_ARTIFACT) return;

  const estado = (texto, alerta = false) => {
    const el = document.getElementById('estado-nuvem');
    if (!el) return;
    el.textContent = texto;
    el.dataset.estado = alerta ? 'erro' : 'ok';
  };
  // JSON com chaves ordenadas: a mesma ficha gera sempre o mesmo texto.
  const canonico = (v) => JSON.stringify(v, (_, x) => (x && typeof x === 'object' && !Array.isArray(x)
    ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]]))
    : x));
  const guardarCopia = () => { try { localStorage.setItem(CHAVE, JSON.stringify(db)); } catch { /* sem armazenamento local */ } };

  estado('⟳ Conectando ao banco…');
  const banco = await window.claude.use('db');
  if (!banco) { estado('⚠ Banco indisponível aqui: alterações ficam só neste aparelho', true); return; }

  const colecao = (col) => banco.doc('crm/escritorio').collection(col);
  const enviado = Object.fromEntries(COLECOES.map((c) => [c, {}])); // última versão gravada de cada registro

  // ===== Envio =====
  let emCurso = false;
  let pendente = false;
  let timer = null;
  async function sincronizar() {
    if (emCurso) { pendente = true; return; }
    emCurso = true;
    try {
      for (const col of COLECOES) {
        const ids = new Set(db[col].map((o) => o.id));
        for (const id of Object.keys(enviado[col])) {
          if (ids.has(id)) continue;
          await colecao(col).doc(id).delete();
          delete enviado[col][id];
        }
        for (const o of db[col]) {
          const texto = canonico(o);
          if (enviado[col][o.id] === texto) continue;
          await colecao(col).doc(o.id).set(JSON.parse(texto));
          enviado[col][o.id] = texto;
        }
      }
      estado('☁ Salvo');
    } catch (e) {
      console.error('Falha ao salvar no banco', e);
      estado(e?.code === 'quota_exceeded' ? '⚠ Banco cheio: exclua registros antigos' : '⚠ Erro ao salvar: tentaremos de novo', true);
      clearTimeout(timer);
      timer = setTimeout(sincronizar, 15000);
    } finally {
      emCurso = false;
      if (pendente) { pendente = false; sincronizar(); }
    }
  }

  // ===== Leitura inicial =====
  const lerTudo = async () => {
    const respostas = await Promise.all(COLECOES.map((c) => colecao(c).get()));
    return Object.fromEntries(COLECOES.map((c, i) => [c, respostas[i].docs.filter((d) => d.exists).map((d) => JSON.parse(JSON.stringify(d.data())))]));
  };
  let remoto = null;
  try {
    remoto = await Promise.race([lerTudo(), new Promise((_, falhar) => setTimeout(() => falhar(new Error('tempo esgotado')), 10000))]);
  } catch (e) {
    console.warn('Banco não respondeu', e);
    estado('⚠ Banco não respondeu: mostrando a cópia deste aparelho', true);
  }
  if (remoto) {
    const total = (d) => COLECOES.reduce((t, c) => t + d[c].length, 0);
    const locais = total(db);
    if (!total(remoto) && locais && await confirmar(`Este aparelho tem ${locais} registro(s) salvos. Enviar para o banco do CRM?`, { ok: 'Enviar' })) {
      // `enviado` vazio: o próximo envio grava tudo.
    } else {
      db = { ...vazio(), ...remoto, meta: db.meta || {} };
      COLECOES.forEach((c) => db[c].forEach((o) => { enviado[c][o.id] = canonico(o); }));
      guardarCopia();
      render();
    }
  }
  window.aoSalvar = () => {
    estado('⟳ Salvando…');
    clearTimeout(timer);
    timer = setTimeout(sincronizar, 400);
  };
  sincronizar();

  // ===== Alterações vindas de outro aparelho, ao vivo =====
  let renderAgendado = null;
  COLECOES.forEach((col) => {
    colecao(col).onSnapshot((resultado) => {
      let mudou = false;
      for (const mudanca of resultado.docChanges()) {
        const id = mudanca.doc.id;
        const local = db[col].find((o) => o.id === id);
        const editadoAqui = local && enviado[col][id] !== undefined && canonico(local) !== enviado[col][id];
        if (mudanca.type === 'removed') {
          if (enviado[col][id] === undefined || editadoAqui) continue;
          delete enviado[col][id];
          db[col] = db[col].filter((o) => o.id !== id);
          mudou = true;
          continue;
        }
        const texto = canonico(mudanca.doc.data());
        if (enviado[col][id] === texto || editadoAqui) continue;
        enviado[col][id] = texto;
        const obj = JSON.parse(texto);
        db[col] = local ? db[col].map((o) => (o.id === id ? obj : o)) : [...db[col], obj];
        mudou = true;
      }
      if (!mudou) return;
      guardarCopia();
      clearTimeout(renderAgendado);
      renderAgendado = setTimeout(render, 300);
    }, (e) => console.warn('Atualização ao vivo interrompida', e));
  });
})();
