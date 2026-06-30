/* ============================================================================
   STOREDATA.JS
   "Banco de dados" (mock) compartilhado entre loja.html, dlc.html e
   soundtrack.html. Centralizar os dados aqui evita duplicar a mesma
   lista em 3 arquivos diferentes — e deixa pronto pra, no futuro,
   trocar por uma chamada fetch() pra API hospedada no Azure.

   Cada DLC e cada Soundtrack tem:
   - id: identificador único, usado na URL (ex: dlc.html?id=neoncat-skins)
   - free: true = grátis ("Adicionar à Biblioteca"), false = pago (mostra preço)
   ============================================================================ */

const STORE_GAMES = [
  {
    id: "neoncat",
    title: "NeonCat Chronicles",
    desc: "Aventura cyberpunk com gatos no espaço profundo",
    price: "R$ 29,99",
    emoji: "🐱",
    thumbBg: null,
    tags: ["Ação", "Retro", "Gatos"],
    categoria: "acao",
  },
  {
    id: "vaporworld",
    title: "Vaporworld Online",
    desc: "MMO no mundo vaporwave — explore dimensões de synth",
    price: "R$ 49,99",
    emoji: "🌌",
    thumbBg: "linear-gradient(135deg, #ff6b6b, #feca57)",
    tags: ["MMO", "Synthwave"],
    categoria: "scifi",
  },
  {
    id: "retrobot",
    title: "RetroBot Uprising",
    desc: "Plataforma pixel art com robôs dos anos 80",
    price: "R$ 19,90",
    emoji: "🤖",
    thumbBg: "linear-gradient(135deg, #48dbfb, #ff9ff3)",
    tags: ["Plataforma", "Pixel", "Robôs"],
    categoria: "retro",
  },
  {
    id: "synthracer",
    title: "SynthRacer 84",
    desc: "Corridas neon em pistas holográficas",
    price: "R$ 39,99",
    emoji: "🎸",
    thumbBg: "linear-gradient(135deg, #2d3561, #c05c7e)",
    tags: ["Corrida", "Neon"],
    categoria: "acao",
  },
  {
    id: "pixeldungeon",
    title: "Pixel Dungeon X",
    desc: "Roguelike com estética de Windows 95",
    price: "R$ 14,99",
    emoji: "🗡️",
    thumbBg: "linear-gradient(135deg, #0f3460, #e94560)",
    tags: ["RPG", "Roguelike"],
    categoria: "rpg",
  },
  {
    id: "vaporblocks",
    title: "VaporBlocks",
    desc: "Quebra-cabeça relaxante ao som de lo-fi vaporwave",
    price: "R$ 9,99",
    emoji: "🧩",
    thumbBg: "linear-gradient(135deg, #6a3aff, #ff6ad5)",
    tags: ["Puzzle", "Relaxante"],
    categoria: "puzzle",
  },
];

// DLCs de jogos que o usuário JÁ TEM. Algumas são gratuitas (free: true),
// outras pagas (free: false, com "price" preenchido).
const STORE_DLCS = [
  {
    id: "neoncat-skins",
    gameTitle: "NeonCat Chronicles",
    name: "Pacote Skins Holográficas",
    desc: "5 skins exclusivas pra customizar seu gato cyberpunk, com efeito holográfico animado.",
    price: "R$ 7,99",
    free: false,
    emoji: "✨",
  },
  {
    id: "pixeldungeon-mapa",
    gameTitle: "Pixel Dungeon X",
    name: "Mapa Secreto: Cripta Neon",
    desc: "Uma masmorra extra escondida, com inimigos remixados e uma trilha sonora própria.",
    price: "R$ 5,99",
    free: false,
    emoji: "🗝️",
  },
  {
    id: "vaporworld-distrito",
    gameTitle: "Vaporworld Online",
    name: "Expansão: Distrito Synth",
    desc: "Nova região do MMO, com missões cooperativas e itens cosméticos vaporwave.",
    price: "R$ 19,99",
    free: false,
    emoji: "🌆",
  },
  {
    id: "retrobot-trilha-bonus",
    gameTitle: "RetroBot Uprising",
    name: "Pacote de Fases Bônus",
    desc: "3 fases extras lançadas em comemoração ao aniversário do jogo. De graça, porque a comunidade merece.",
    price: "Grátis",
    free: true,
    emoji: "🎁",
  },
  {
    id: "synthracer-pista-extra",
    gameTitle: "SynthRacer 84",
    name: "Pista Bônus: Loop Holográfico",
    desc: "Uma pista extra liberada gratuitamente pra quem já tem o jogo.",
    price: "Grátis",
    free: true,
    emoji: "🏁",
  },
];

// Soundtracks. Algumas faixas/álbuns são liberados de graça (geralmente
// faixas avulsas), outras são o álbum completo, pago.
const STORE_SOUNDTRACKS = [
  {
    id: "neoncat-ost-neonalley",
    gameTitle: "NeonCat Chronicles",
    track: "Neon Alley",
    desc: "Faixa-tema do primeiro capítulo. Sintetizadores pesados e bateria de 808.",
    durationLabel: "3:42",
    price: "R$ 4,99 (álbum completo)",
    free: false,
    emoji: "🎵",
  },
  {
    id: "vaporworld-ost-drift",
    gameTitle: "Vaporworld Online",
    track: "Drift Forever",
    desc: "Tema ambiente do Distrito Synth, em loop por horas sem cansar.",
    durationLabel: "5:10",
    price: "R$ 6,99 (álbum completo)",
    free: false,
    emoji: "🎶",
  },
  {
    id: "synthracer-ost-midnight",
    gameTitle: "SynthRacer 84",
    track: "Midnight Circuit",
    desc: "A faixa principal das corridas noturnas. Liberada de graça pela trilha ser tão boa quanto o jogo.",
    durationLabel: "4:05",
    price: "Grátis",
    free: true,
    emoji: "🎧",
  },
  {
    id: "retrobot-ost-tema",
    gameTitle: "RetroBot Uprising",
    track: "8-Bit Heart",
    desc: "Tema clássico chiptune, faixa avulsa liberada de graça pra quem já tem o jogo.",
    durationLabel: "2:58",
    price: "Grátis",
    free: true,
    emoji: "🤖",
  },
];

// Rótulos legíveis de categoria, usados no título da lista de jogos da loja
const CATEGORY_LABELS = {
  todos: "Todos os Jogos",
  acao: "Ação",
  puzzle: "Puzzle",
  rpg: "RPG",
  scifi: "Sci-Fi",
  retro: "Retro",
};
