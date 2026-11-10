'use strict';

/* Avatares do time do Escritório Digital Lopes Araújo.
 * Todos no mesmo estilo (ilustração plana em círculo); cada um com um traço da função.
 * avatarSVG(id, tamanho) devolve o SVG como texto. */

const PELE = { clara: '#F2CBA8', media: '#DDA77F', morena: '#B97E57', escura: '#87563A' };

const TIME = {
  adonias: { nome: 'Dr. Adonias', cargo: 'Diretor', fundo: '#DCE3F0', roupa: '#1F2A44', pele: PELE.media, cabelo: 'curto', corCabelo: '#2B2018', extra: ['terno'], selo: null },
  claude: { nome: 'Claude', cargo: 'Gerente geral', fundo: '#F6E3D8', especial: 'claude' },
  tessa: { nome: 'TESSA', cargo: 'Teses e nichos', fundo: '#DDF0EC', roupa: '#1E7F74', pele: PELE.clara, cabelo: 'coque', corCabelo: '#5A3A22', extra: ['oculos'], selo: 'lupa', corSelo: '#1E7F74' },
  guido: { nome: 'GUIDO', cargo: 'Campanhas', fundo: '#E3E8F8', roupa: '#3A55B4', pele: PELE.morena, cabelo: 'curto', corCabelo: '#1C1410', extra: ['barba'], selo: 'grafico', corSelo: '#3A55B4' },
  plinio: { nome: 'PLÍNIO', cargo: 'Copywriter', fundo: '#F4E9D6', roupa: '#A8692A', pele: PELE.escura, cabelo: 'cacheado', corCabelo: '#1A120D', extra: [], selo: 'pena', corSelo: '#A8692A' },
  iris: { nome: 'ÍRIS', cargo: 'Criativos', fundo: '#EFE3F6', roupa: '#8A3FB0', pele: PELE.media, cabelo: 'longoMecha', corCabelo: '#2A1A24', extra: [], selo: 'paleta', corSelo: '#8A3FB0' },
  lara: { nome: 'LARA', cargo: 'Secretária', fundo: '#FBE4E6', roupa: '#C2475A', pele: PELE.morena, cabelo: 'longo', corCabelo: '#2A1B14', extra: ['headset'], selo: null },
  rui: { nome: 'RUI', cargo: 'Advogado', fundo: '#E6E2DA', roupa: '#1A1A1A', pele: PELE.clara, cabelo: 'grisalho', corCabelo: '#BDBDBD', extra: ['bigode', 'oculos', 'beca'], selo: 'balanca', corSelo: '#1A1A1A' },
  aureo: { nome: 'ÁUREO', cargo: 'Financeiro', fundo: '#F7EFD2', roupa: '#2F6B4F', pele: PELE.clara, cabelo: 'lateral', corCabelo: '#6B4A2B', extra: ['colete'], selo: 'moeda', corSelo: '#B8860B' },
};

function cabeloAtras(estilo, cor) {
  switch (estilo) {
    case 'longo':
    case 'longoMecha':
      return `<path d="M35 54 C32 27 47 19 60 19 C74 19 89 27 85 56 L88 92 C79 97 70 95 66 90 L54 90 C50 95 40 97 32 92 Z" fill="${cor}"/>`;
    case 'coque':
      return `<circle cx="60" cy="21" r="10" fill="${cor}"/><path d="M38 52 C37 33 48 26 60 26 C73 26 84 33 82 52 Z" fill="${cor}"/>`;
    default:
      return '';
  }
}

function cabeloFrente(estilo, cor) {
  switch (estilo) {
    case 'curto':
      return `<path d="M38 50 C37 31 47 24 60 24 C74 24 84 31 82 50 C79 41 72 36 60 36 C49 36 42 41 38 50 Z" fill="${cor}"/>`;
    case 'lateral':
      return `<path d="M38 50 C37 31 48 24 61 24 C74 24 84 31 82 50 C78 40 70 35 58 37 C52 38 47 36 44 33 C41 38 39 44 38 50 Z" fill="${cor}"/>`;
    case 'cacheado': {
      const bolas = [[41, 37], [46, 29], [54, 24], [63, 23], [71, 26], [77, 32], [80, 40], [38, 45]];
      return bolas.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7.5" fill="${cor}"/>`).join('');
    }
    case 'grisalho':
      return `<path d="M38 52 C37 40 41 33 46 31 C44 38 43 44 42 52 Z M82 52 C83 40 79 33 74 31 C76 38 77 44 78 52 Z" fill="${cor}"/><path d="M47 30 C53 27 67 27 73 30 C68 29 52 29 47 30 Z" fill="${cor}"/>`;
    case 'coque':
      return `<path d="M39 47 C42 33 52 29 61 29 C71 29 79 35 81 47 C73 39 64 37 55 39 C48 41 43 43 39 47 Z" fill="${cor}"/>`;
    case 'longo':
      return `<path d="M39 49 C41 32 51 27 62 28 C72 29 80 36 81 49 C74 40 64 37 54 40 C47 42 42 45 39 49 Z" fill="${cor}"/>`;
    case 'longoMecha':
      return `<path d="M39 49 C41 32 51 27 62 28 C72 29 80 36 81 49 C74 40 64 37 54 40 C47 42 42 45 39 49 Z" fill="${cor}"/><path d="M66 29 C74 31 79 37 81 47 C77 41 72 37 66 35 Z" fill="#C06BD8"/>`;
    default:
      return '';
  }
}

function rosto(p) {
  return `
    <rect x="52" y="66" width="16" height="18" rx="6" fill="${p.pele}"/>
    <rect x="52" y="66" width="16" height="7" fill="#000" opacity="0.08"/>
    <circle cx="39" cy="55" r="4.5" fill="${p.pele}"/><circle cx="81" cy="55" r="4.5" fill="${p.pele}"/>
    <ellipse cx="60" cy="52" rx="21" ry="24" fill="${p.pele}"/>
    <circle cx="52" cy="54" r="2.6" fill="#2A211C"/><circle cx="68" cy="54" r="2.6" fill="#2A211C"/>
    <circle cx="52.8" cy="53.2" r="0.8" fill="#fff"/><circle cx="68.8" cy="53.2" r="0.8" fill="#fff"/>
    <path d="M47.5 48 Q52 45.5 56 47.5 M64 47.5 Q68 45.5 72.5 48" stroke="#3A2A20" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <circle cx="47" cy="61" r="3.5" fill="#E8836B" opacity="0.25"/><circle cx="73" cy="61" r="3.5" fill="#E8836B" opacity="0.25"/>
    <path d="M54 64 Q60 69 66 64" stroke="#7A3B2E" stroke-width="2" fill="none" stroke-linecap="round"/>`;
}

function roupa(p) {
  let base = `<path d="M16 122 C16 94 36 83 60 83 C84 83 104 94 104 122 Z" fill="${p.roupa}"/>`;
  if (p.extra.includes('terno')) {
    base += `<path d="M52 83 L60 98 L68 83 Z" fill="#FFFFFF"/><path d="M58 86 L62 86 L63 99 L60 103 L57 99 Z" fill="#B08D57"/>
      <path d="M52 83 L60 104 L45 92 Z M68 83 L60 104 L75 92 Z" fill="#162036"/>`;
  } else if (p.extra.includes('beca')) {
    base += `<path d="M54 83 L60 92 L66 83 Z" fill="#FFFFFF"/><rect x="57" y="90" width="2.6" height="10" rx="1" fill="#FFFFFF"/><rect x="60.4" y="90" width="2.6" height="10" rx="1" fill="#FFFFFF"/>`;
  } else if (p.extra.includes('colete')) {
    base += `<path d="M53 83 L60 95 L67 83 Z" fill="#F4F1EA"/><path d="M44 89 L57 96 L57 122 L40 122 Z M76 89 L63 96 L63 122 L80 122 Z" fill="#B8860B" opacity="0.9"/>`;
  } else {
    base += `<path d="M53 83 Q60 91 67 83" stroke="#FFFFFF" stroke-opacity="0.55" stroke-width="2.4" fill="none"/>`;
  }
  return base;
}

function acessorios(p) {
  let s = '';
  if (p.extra.includes('barba')) s += `<path d="M41 58 C42 72 51 78 60 78 C69 78 78 72 79 58 C76 66 70 70 60 70 C50 70 44 66 41 58 Z" fill="${p.corCabelo}"/><path d="M54 65 Q60 68 66 65" stroke="#F2D9C6" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  if (p.extra.includes('bigode')) s += `<path d="M50 63 C54 59 58 60 60 62 C62 60 66 59 70 63 C66 63 63 64 60 64 C57 64 54 63 50 63 Z" fill="#9E9E9E"/>`;
  if (p.extra.includes('oculos')) s += `<rect x="45" y="49" width="13" height="10" rx="4" fill="none" stroke="#2A211C" stroke-width="1.8"/><rect x="62" y="49" width="13" height="10" rx="4" fill="none" stroke="#2A211C" stroke-width="1.8"/><path d="M58 53 L62 53" stroke="#2A211C" stroke-width="1.8"/>`;
  if (p.extra.includes('headset')) s += `<path d="M37 54 C37 30 49 23 60 23 C71 23 83 30 83 54" stroke="#3A3A3A" stroke-width="3.2" fill="none"/><rect x="33" y="49" width="7" height="12" rx="3" fill="#3A3A3A"/><rect x="80" y="49" width="7" height="12" rx="3" fill="#3A3A3A"/><path d="M36 60 C38 70 46 72 52 70" stroke="#3A3A3A" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="53" cy="70" r="2.6" fill="#3A3A3A"/>`;
  return s;
}

function selo(tipo, cor) {
  if (!tipo) return '';
  const icones = {
    lupa: `<circle cx="-2" cy="-2" r="5.5" fill="none" stroke="${cor}" stroke-width="2.4"/><path d="M2 2 L7 7" stroke="${cor}" stroke-width="2.6" stroke-linecap="round"/>`,
    grafico: `<path d="M-7 5 L-2 0 L2 3 L7 -5" stroke="${cor}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 -5 L7 -5 L7 -1" stroke="${cor}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    pena: `<path d="M6 -7 C-2 -6 -6 2 -6 7 C-1 3 4 -1 6 -7 Z" fill="${cor}"/><path d="M-6 7 L1 0" stroke="#fff" stroke-width="1.2"/>`,
    paleta: `<path d="M0 -7 C6 -7 8 -2 7 1 C6 4 2 2 2 5 C2 8 -1 8 -3 7 C-7 5 -8 -1 -5 -5 C-4 -6 -2 -7 0 -7 Z" fill="${cor}"/><circle cx="-3" cy="-3" r="1.4" fill="#F2C94C"/><circle cx="1" cy="-4" r="1.4" fill="#56CCF2"/><circle cx="-4" cy="2" r="1.4" fill="#EB5757"/>`,
    balanca: `<path d="M0 -7 L0 6 M-6 6 L6 6 M-7 -4 L7 -4" stroke="${cor}" stroke-width="1.8" stroke-linecap="round"/><path d="M-7 -4 L-9 1 L-5 1 Z M7 -4 L5 1 L9 1 Z" fill="${cor}"/>`,
    moeda: `<circle r="7" fill="${cor}"/><circle r="5" fill="none" stroke="#FFF3C4" stroke-width="1"/><text y="2.6" text-anchor="middle" font-size="7" font-weight="700" fill="#FFF3C4" font-family="Arial, sans-serif">R$</text>`,
  };
  return `<g transform="translate(95 95)"><circle r="13" fill="#FFFFFF"/><circle r="13" fill="none" stroke="${cor}" stroke-opacity="0.25" stroke-width="2"/>${icones[tipo]}</g>`;
}

function avatarClaude(p, uid) {
  const raios = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const x = 60 + Math.cos(a) * 30;
    const y = 60 + Math.sin(a) * 30;
    return `<path d="M60 60 L${x.toFixed(1)} ${y.toFixed(1)}" stroke="#D97757" stroke-width="10" stroke-linecap="round"/>`;
  }).join('');
  return `<clipPath id="c${uid}"><circle cx="60" cy="60" r="60"/></clipPath><g clip-path="url(#c${uid})"><rect width="120" height="120" fill="${p.fundo}"/>${raios}<circle cx="60" cy="60" r="9" fill="#D97757"/></g>`;
}

let contadorAvatar = 0;
function avatarSVG(id, tamanho = 96) {
  const p = TIME[id];
  if (!p) return '';
  const uid = `${id}${++contadorAvatar}`;
  const corpo = p.especial === 'claude'
    ? avatarClaude(p, uid)
    : `<clipPath id="c${uid}"><circle cx="60" cy="60" r="60"/></clipPath>
       <g clip-path="url(#c${uid})"><rect width="120" height="120" fill="${p.fundo}"/>
       ${cabeloAtras(p.cabelo, p.corCabelo)}${roupa(p)}${rosto(p)}${cabeloFrente(p.cabelo, p.corCabelo)}${acessorios(p)}</g>
       ${selo(p.selo, p.corSelo)}`;
  return `<svg class="avatar" width="${tamanho}" height="${tamanho}" viewBox="0 0 120 120" role="img" aria-label="${p.nome}, ${p.cargo}">${corpo}</svg>`;
}

if (typeof window !== 'undefined') Object.assign(window, { TIME, avatarSVG });
