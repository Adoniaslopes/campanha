'use strict';

/* Avatares do time do Escritório Digital Lopes Araújo.
 * Estilo ilustração plana, equipe jovem; cada um com um traço da função.
 * avatarSVG(id, tamanho) devolve o SVG como texto. */

const PELE = { clara: '#F5D0B0', media: '#E0AC85', morena: '#C08660', escura: '#8C5A3C' };

const TIME = {
  adonias: { nome: 'Dr. Adonias', cargo: 'Diretor', fundo: '#DCE5F2', roupa: '#1F2A44', pele: PELE.media, cabelo: 'lateral', corCabelo: '#2B2018', extra: ['gravata'], selo: null },
  claude: { nome: 'HARVEY', cargo: 'Gerente geral', fundo: '#DDE7F7', roupa: '#24324F', pele: PELE.clara, cabelo: 'topete', corCabelo: '#3B2A1E', extra: ['blazer', 'barbaRala'], selo: null },
  lara: { nome: 'DONNA', cargo: 'Secretária', fundo: '#E3EAF3', roupa: '#9DB0C4', pele: PELE.clara, cabelo: 'ondulado', corCabelo: '#B4501F', extra: ['brincos'], selo: null },
  rui: { nome: 'LOUIS', cargo: 'Advogado Sênior', fundo: '#E4E8EF', roupa: '#1F2A44', pele: PELE.clara, cabelo: 'fade', corCabelo: '#2A2320', extra: ['gravata', 'barbaRala'], selo: 'balanca', corSelo: '#1F2A44' },
  aureo: { nome: 'MIKE', cargo: 'Financeiro', fundo: '#F3EEDD', roupa: '#34465F', pele: PELE.clara, cabelo: 'lateral', corCabelo: '#2A1F18', extra: ['gravata', 'barbaRala'], selo: 'moeda', corSelo: '#C9961A' },
  tessa: { nome: 'JESSICA', cargo: 'Teses e nichos', fundo: '#EFE7DC', roupa: '#C9AE8E', pele: PELE.morena, cabelo: 'ondulado', corCabelo: '#3B2418', extra: ['brincos'], selo: 'lupa', corSelo: '#8A6A45' },
  guido: { nome: 'ALEX', cargo: 'Campanhas', fundo: '#E6E8EC', roupa: '#5B6170', pele: PELE.escura, cabelo: 'fade', corCabelo: '#15100C', extra: ['gravata', 'barba'], selo: 'grafico', corSelo: '#3C5CC8' },
  plinio: { nome: 'RACHEL', cargo: 'Copywriter', fundo: '#F3EDE3', roupa: '#EFE6D6', pele: PELE.media, cabelo: 'ondulado', corCabelo: '#5A3420', extra: ['brincos'], selo: 'pena', corSelo: '#C0682F' },
  kyle: { nome: 'KYLE', cargo: 'Advogado Júnior', fundo: '#E3E9F1', roupa: '#2C3A52', pele: PELE.clara, cabelo: 'lateral', corCabelo: '#6B4A2B', extra: ['gravata'], selo: 'balanca', corSelo: '#2C3A52' },
  iris: { nome: 'SAMANTHA', cargo: 'Criativos', fundo: '#ECE6F3', roupa: '#1E1E24', pele: PELE.clara, cabelo: 'chanel', corCabelo: '#E0C07A', extra: ['brincos'], selo: 'paleta', corSelo: '#8E44C0' },
};

function cabeloAtras(estilo, cor) {
  switch (estilo) {
    case 'ondulado':
      return `<path d="M36 52 C33 26 48 18 60 18 C73 18 88 26 85 52 C88 66 86 82 90 94 C80 99 72 96 68 90 L52 90 C48 96 40 99 30 94 C34 82 32 66 36 52 Z" fill="${cor}"/>`;
    case 'chanel':
      return `<path d="M36 50 C34 28 47 19 60 19 C73 19 86 28 84 50 L86 74 C80 78 74 77 72 72 L48 72 C46 77 40 78 34 74 Z" fill="${cor}"/>`;
    case 'rabo':
      return `<path d="M76 30 C92 30 96 50 90 70 C88 60 84 50 78 44 Z" fill="${cor}"/>`;
    case 'blackPower':
      return `<circle cx="60" cy="38" r="27" fill="${cor}"/>`;
    default:
      return '';
  }
}

function cabeloFrente(estilo, cor) {
  switch (estilo) {
    case 'topete':
      return `<path d="M39 48 C37 30 47 20 62 20 C72 20 80 24 82 34 C83 40 82 45 81 48 C78 40 72 35 63 35 C56 35 50 34 46 31 C43 36 41 42 39 48 Z" fill="${cor}"/><path d="M50 24 C58 15 74 16 80 26 C72 22 62 22 50 24 Z" fill="${cor}"/>`;
    case 'curto':
      return `<path d="M39 48 C38 31 48 24 60 24 C73 24 83 31 81 48 C78 40 71 35 60 35 C50 35 42 40 39 48 Z" fill="${cor}"/>`;
    case 'fade':
      return `<path d="M40 44 C40 30 49 24 60 24 C71 24 80 30 80 44 C76 38 69 34 60 34 C51 34 44 38 40 44 Z" fill="${cor}"/><path d="M39 46 C39 42 40 40 41 39 L41 50 Z M81 46 C81 42 80 40 79 39 L79 50 Z" fill="${cor}" opacity="0.45"/>`;
    case 'lateral':
      return `<path d="M39 48 C37 31 48 23 61 23 C74 23 84 31 81 48 C78 39 70 34 57 36 C51 37 46 35 44 32 C41 37 40 43 39 48 Z" fill="${cor}"/>`;
    case 'blackPower':
      return `<path d="M38 46 C38 32 48 26 60 26 C72 26 82 32 82 46 C77 40 70 37 60 37 C50 37 43 40 38 46 Z" fill="${cor}"/>`;
    case 'ondulado':
      return `<path d="M39 50 C40 31 51 25 62 26 C73 27 81 35 81 50 C77 41 70 36 61 37 C55 38 50 42 47 46 C45 41 42 44 39 50 Z" fill="${cor}"/>`;
    case 'chanel':
      return `<path d="M38 50 C39 30 50 24 61 24 C73 24 82 32 82 50 C79 40 71 34 60 34 C52 34 45 40 42 47 C40 46 39 48 38 50 Z" fill="${cor}"/><path d="M68 26 C76 29 81 36 82 46 C78 40 73 36 68 34 Z" fill="#B266E0"/>`;
    case 'rabo':
      return `<path d="M39 48 C40 31 50 24 61 24 C73 24 82 32 81 48 C77 39 70 34 60 34 C51 34 44 39 39 48 Z" fill="${cor}"/><circle cx="78" cy="32" r="3.6" fill="#1E8A7C"/>`;
    default:
      return '';
  }
}

function rosto(p) {
  return `
    <rect x="53" y="66" width="14" height="16" rx="6" fill="${p.pele}"/>
    <rect x="53" y="66" width="14" height="6" fill="#000" opacity="0.08"/>
    <circle cx="39.5" cy="54" r="4.2" fill="${p.pele}"/><circle cx="80.5" cy="54" r="4.2" fill="${p.pele}"/>
    <ellipse cx="60" cy="51" rx="20.5" ry="22.5" fill="${p.pele}"/>
    <ellipse cx="52" cy="54" rx="3.1" ry="3.6" fill="#241B16"/><ellipse cx="68" cy="54" rx="3.1" ry="3.6" fill="#241B16"/>
    <circle cx="53.1" cy="52.6" r="1.1" fill="#fff"/><circle cx="69.1" cy="52.6" r="1.1" fill="#fff"/>
    <path d="M47.5 46.5 Q52 44.5 56 46 M64 46 Q68 44.5 72.5 46.5" stroke="#3A2A20" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <circle cx="46.5" cy="61" r="3.4" fill="#F08A75" opacity="0.28"/><circle cx="73.5" cy="61" r="3.4" fill="#F08A75" opacity="0.28"/>
    <path d="M53.5 62.5 Q60 69.5 66.5 62.5 Q60 65 53.5 62.5 Z" fill="#8A3A2C"/><path d="M55.5 63.4 Q60 64.8 64.5 63.4" stroke="#fff" stroke-width="1.2" fill="none"/>`;
}

function roupa(p) {
  let base = `<path d="M18 122 C18 95 37 84 60 84 C83 84 102 95 102 122 Z" fill="${p.roupa}"/>`;
  const x = p.extra;
  if (x.includes('blazer')) {
    base += `<path d="M50 84 L60 122 L70 84 Z" fill="#F3F5F8"/><path d="M50 84 L58 104 L44 94 Z M70 84 L62 104 L76 94 Z" fill="#17213A"/>`;
  } else if (x.includes('gravata')) {
    base += `<path d="M51 84 L60 99 L69 84 Z" fill="#FFFFFF"/><path d="M58 87 L62 87 L63.5 101 L60 106 L56.5 101 Z" fill="#B08D57"/><path d="M51 84 L60 106 L45 93 Z M69 84 L60 106 L75 93 Z" fill="#151B2B" opacity="0.85"/>`;
  } else if (x.includes('moletom')) {
    base += `<path d="M46 86 C50 95 70 95 74 86" stroke="#000" stroke-opacity="0.18" stroke-width="5" fill="none"/><path d="M55 94 L54 106 M65 94 L66 106" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/>`;
  } else if (x.includes('camisa')) {
    base += `<path d="M50 84 L57 94 L60 88 L63 94 L70 84 Z" fill="#FFFFFF" opacity="0.9"/><path d="M60 92 L60 122" stroke="#000" stroke-opacity="0.15" stroke-width="1.4"/>`;
  } else {
    base += `<path d="M52 84 Q60 92 68 84" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="2.4" fill="none"/>`;
  }
  return base;
}

function acessorios(p) {
  const x = p.extra;
  let s = '';
  if (x.includes('barba')) s += `<path d="M41 57 C42 71 51 76 60 76 C69 76 78 71 79 57 C76 64 70 68 60 68 C50 68 44 64 41 57 Z" fill="${p.corCabelo}"/><path d="M53.5 62.5 Q60 69.5 66.5 62.5 Q60 65 53.5 62.5 Z" fill="#8A3A2C"/>`;
  if (x.includes('barbaRala')) s += `<path d="M42 58 C44 70 52 74 60 74 C68 74 76 70 78 58 C75 65 69 69 60 69 C51 69 45 65 42 58 Z" fill="${p.corCabelo}" opacity="0.35"/>`;
  if (x.includes('oculos')) s += `<rect x="45" y="49" width="13.5" height="10" rx="3" fill="none" stroke="#1E1E1E" stroke-width="2"/><rect x="61.5" y="49" width="13.5" height="10" rx="3" fill="none" stroke="#1E1E1E" stroke-width="2"/><path d="M58.5 53 L61.5 53" stroke="#1E1E1E" stroke-width="2"/>`;
  if (x.includes('oculosRedondo')) s += `<circle cx="52" cy="54" r="6.6" fill="none" stroke="#7A4A2A" stroke-width="1.8"/><circle cx="68" cy="54" r="6.6" fill="none" stroke="#7A4A2A" stroke-width="1.8"/><path d="M58.6 53 L61.4 53" stroke="#7A4A2A" stroke-width="1.8"/>`;
  if (x.includes('brincos')) s += `<circle cx="39.5" cy="60" r="1.9" fill="#E8C35A"/><circle cx="80.5" cy="60" r="1.9" fill="#E8C35A"/>`;
  if (x.includes('headset')) s += `<path d="M37 53 C37 30 49 22 60 22 C71 22 83 30 83 53" stroke="#2F2F38" stroke-width="3" fill="none"/><rect x="33.5" y="48" width="7" height="11" rx="3" fill="#2F2F38"/><rect x="79.5" y="48" width="7" height="11" rx="3" fill="#2F2F38"/><path d="M37 58 C39 67 46 70 52 68" stroke="#2F2F38" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="53" cy="68" r="2.4" fill="#2F2F38"/>`;
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

let contadorAvatar = 0;
function avatarSVG(id, tamanho = 96) {
  const p = TIME[id];
  if (!p) return '';
  const uid = `${id}${++contadorAvatar}`;
  const corpo = `<clipPath id="c${uid}"><circle cx="60" cy="60" r="60"/></clipPath>
       <g clip-path="url(#c${uid})"><rect width="120" height="120" fill="${p.fundo}"/>
       ${cabeloAtras(p.cabelo, p.corCabelo)}${roupa(p)}${rosto(p)}${cabeloFrente(p.cabelo, p.corCabelo)}${acessorios(p)}</g>
       ${selo(p.selo, p.corSelo)}`;
  return `<svg class="avatar" width="${tamanho}" height="${tamanho}" viewBox="0 0 120 120" role="img" aria-label="${p.nome}, ${p.cargo}">${corpo}</svg>`;
}

if (typeof window !== 'undefined') Object.assign(window, { TIME, avatarSVG });
