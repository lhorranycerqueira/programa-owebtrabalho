// DADOS DOS AMIGOS
// como não temos o fetch() para inserir dados que existem mesmo/num servidor de verdade, portanto temos apenas amigos fantasmas.

const modalAmigosData = [
  { nome: 'NeonKitty',     emoji: '🐱', status: 'online',  atividade: 'Online' },
  { nome: 'CyberBot99',    emoji: '🤖', status: 'jogando', atividade: 'Jogando NeonCat Chronicles' },
  { nome: 'VaporFox',      emoji: '🦊', status: 'jogando', atividade: 'Jogando SynthRacer 84' },
  { nome: 'PixelWitch',    emoji: '🧙', status: 'online',  atividade: 'Online' },
  { nome: 'RetroStar_X',   emoji: '⭐', status: 'ausente', atividade: 'Ausente — idle 15min' },
  { nome: 'PixelGhost',    emoji: '👾', status: 'offline', atividade: 'Offline — 2 dias atrás' },
  { nome: 'MidnightSynth', emoji: '🌙', status: 'offline', atividade: 'Offline — 5 dias atrás' },
  { nome: 'LaserRaven',    emoji: '🦅', status: 'offline', atividade: 'Offline — 1 semana' },
];

let modalAbaAtiva = 'todos';

function abrirModalAmigos() {
  const overlay = document.getElementById('modal-amigos-overlay');
  overlay.style.display = 'flex';
  document.getElementById('modal-busca').value = '';
  renderizarModalAmigos();
}

function fecharModalAmigos(event) {
  if (event && event.target !== document.getElementById('modal-amigos-overlay')) return;
  document.getElementById('modal-amigos-overlay').style.display = 'none';
}

function setAbaModal(aba) {
  modalAbaAtiva = aba;
  ['todos','online','jogando','offline'].forEach(a => {
    document.getElementById('aba-' + a).classList.remove('modal-aba-ativa');
  });
  document.getElementById('aba-' + aba).classList.add('modal-aba-ativa');
  renderizarModalAmigos();
}

function filtrarModalAmigos() {
  renderizarModalAmigos();
}

function renderizarModalAmigos() {
  const busca    = document.getElementById('modal-busca').value.toLowerCase().trim();
  const lista    = document.getElementById('modal-lista-amigos');
  const contador = document.getElementById('modal-contador');

  const filtrado = modalAmigosData.filter(a => {
    const matchAba =
      modalAbaAtiva === 'todos'   ? true :
      modalAbaAtiva === 'online'  ? (a.status === 'online' || a.status === 'ausente') :
      modalAbaAtiva === 'jogando' ? a.status === 'jogando' :
      modalAbaAtiva === 'offline' ? a.status === 'offline' : true;
    return matchAba && (!busca || a.nome.toLowerCase().includes(busca));
  });

  const jogando = filtrado.filter(a => a.status === 'jogando');
  const online  = filtrado.filter(a => a.status === 'online' || a.status === 'ausente');
  const offline = filtrado.filter(a => a.status === 'offline');

  let html = '';
  if (jogando.length) {
    html += `<div class="modal-section-label">▶ JOGANDO AGORA (${jogando.length})</div>`;
    jogando.forEach(a => html += criarLinhaAmigo(a));
  }
  if (online.length) {
    html += `<div class="modal-section-label">● ONLINE (${online.length})</div>`;
    online.forEach(a => html += criarLinhaAmigo(a));
  }
  if (offline.length && (modalAbaAtiva === 'todos' || modalAbaAtiva === 'offline')) {
    html += `<div class="modal-section-label">○ OFFLINE (${offline.length})</div>`;
    offline.forEach(a => html += criarLinhaAmigo(a, true));
  }
  if (!filtrado.length) {
    html = `<div class="modal-empty">Nenhum amigo encontrado.<br><span style="color:rgba(0,234,255,0.3);">Tente outro nome ou aba.</span></div>`;
  }

  lista.innerHTML = html;
  const onlineTotal = modalAmigosData.filter(a => a.status !== 'offline').length;
  contador.textContent = `${onlineTotal} online · ${modalAmigosData.length} total`;
}

function criarLinhaAmigo(amigo, dimmed) {
  const dotClass = { online:'dot-online', jogando:'dot-jogando', ausente:'dot-ausente', offline:'dot-offline' }[amigo.status] || 'dot-offline';
  const isJogando = amigo.status === 'jogando';
  const btnJogar  = isJogando
    ? `<div class="modal-acao-btn" onclick="showToast('🎮 Pedindo para entrar na partida de ${amigo.nome}...')">▶</div>`
    : '';
  return `
    <div class="modal-amigo-row" style="${dimmed ? 'opacity:0.45;' : ''}">
      <div class="modal-avatar">
        ${amigo.emoji}
        <div class="modal-status-dot ${dotClass}"></div>
      </div>
      <div class="modal-amigo-info">
        <div class="modal-amigo-nome">${amigo.nome}</div>
        <div class="modal-amigo-atividade ${isJogando ? 'jogando' : ''}">${amigo.atividade}</div>
      </div>
      <div class="modal-amigo-acoes">
        ${btnJogar}
        <div class="modal-acao-btn" onclick="showToast('💬 Chat com ${amigo.nome} — em breve!')">💬</div>
        <div class="modal-acao-btn" onclick="showToast('👤 Abrindo perfil de ${amigo.nome}...')">👤</div>
      </div>
    </div>`;
}

// Fechar com ESC (adicionado ao listener que já existe no arquivo)
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const overlay = document.getElementById('modal-amigos-overlay');
    if (overlay && overlay.style.display === 'flex') {
      overlay.style.display = 'none';
    }
  }
});