/* ============================================================================
   SCRIPTSOUNDTRACK.JS
   Lógica da página de uma faixa/soundtrack específica.
   Mesmo princípio do scriptDlc.js: lê o "id" da URL, busca em
   STORE_SOUNDTRACKS (storeData.js) e renderiza.

   O player aqui é "fake" (não tem um arquivo de áudio real ainda) — ele
   simula o progresso pra dar a sensação de player. Quando existir um
   arquivo de áudio de verdade (ex: vindo do Azure Blob Storage), troque
   o conteúdo de togglePlay() por um <audio> real, comentado mais abaixo.
   ============================================================================ */

let toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
}

function goTo(url) {
  window.location.href = url;
}

function getIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

// Controla o "progresso" fake do player (de 0 a 100)
let playInterval = null;
let isPlaying = false;

function togglePlay() {
  const fill = document.getElementById("trackBarFill");
  const btn = document.getElementById("playPauseBtn");

  if (isPlaying) {
    // Pausa: para o intervalo que ia enchendo a barra
    clearInterval(playInterval);
    isPlaying = false;
    btn.textContent = "▶";
    return;
  }

  isPlaying = true;
  btn.textContent = "⏸";

  // ----------------------------------------------------------------
  // SUBSTITUIR DEPOIS por áudio de verdade, por exemplo:
  //
  //   const audio = new Audio(track.audioUrl); // url vinda do Azure
  //   audio.play();
  //   audio.addEventListener("timeupdate", () => {
  //     fill.style.width = (audio.currentTime / audio.duration) * 100 + "%";
  //   });
  //
  // Por enquanto, simulamos o avanço da barra a cada 150ms:
  // ----------------------------------------------------------------
  let progresso = parseFloat(fill.style.width) || 0;
  playInterval = setInterval(() => {
    progresso += 1;
    if (progresso >= 100) {
      progresso = 0; // volta ao início (loop), como uma trilha ambiente
    }
    fill.style.width = progresso + "%";
  }, 150);
}

function comprarOuBaixarTrack(trackId) {
  const track = STORE_SOUNDTRACKS.find((t) => t.id === trackId);
  if (!track) return;
  if (track.free) {
    showToast(`✅ "${track.track}" adicionada à sua biblioteca de música!`);
  } else {
    showToast(`💳 Compra do álbum de "${track.track}" confirmada — ${track.price}`);
  }
  // TODO (Azure): chamar API real de compra/liberação de soundtrack aqui.
}

function renderTrackPage() {
  const id = getIdFromUrl();
  const track = STORE_SOUNDTRACKS.find((t) => t.id === id);
  const content = document.getElementById("trackContent");

  if (!track) {
    content.innerHTML = `
      <div class="empty-state">
        Faixa não encontrada. <br />
        <button class="cat-btn" style="margin-top: 10px;" onclick="goTo('loja.html')">Voltar à loja</button>
      </div>
    `;
    return;
  }

  document.getElementById("trackWindowTitle").textContent = `🎵 ${track.track}`;
  document.title = `${track.track} - SteamWave`;

  const priceTagHtml = track.free
    ? `<span class="price-tag free">GRÁTIS</span>`
    : `<span class="price-tag paid">${track.price}</span>`;

  const buttonLabel = track.free
    ? "➕ Adicionar à Biblioteca de Música"
    : `🛒 Comprar Álbum — ${track.price}`;

  content.innerHTML = `
    <div class="product-page">
      <div class="product-cover">${track.emoji}</div>
      <div class="product-info">
        <div class="product-game">De: ${track.gameTitle}</div>
        <h2 class="product-title">${track.track}</h2>
        ${priceTagHtml}
        <p class="product-desc">${track.desc}</p>

        <!-- Player fake: botão play/pause + barra de progresso -->
        <div class="track-player">
          <button class="play-btn" id="playPauseBtn" onclick="togglePlay()">▶</button>
          <div style="flex:1;">
            <div class="track-bar">
              <div class="track-bar-fill" id="trackBarFill" style="width:0%"></div>
            </div>
            <div class="track-duration">${track.durationLabel}</div>
          </div>
        </div>

        <button class="buy-btn ${track.free ? "buy-btn-free" : ""}" onclick="comprarOuBaixarTrack('${track.id}')">
          ${buttonLabel}
        </button>
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", renderTrackPage);
