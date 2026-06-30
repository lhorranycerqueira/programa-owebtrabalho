/* ============================================================================
   SCRIPTLOJA.JS
   Lógica da página da Loja.

   Os dados (jogos, DLCs, soundtracks) NÃO estão aqui — eles vivem em
   storeData.js, que precisa ser carregado ANTES deste arquivo no HTML:
     <script src="../js/storeData.js"></script>
     <script src="../js/scriptLoja.js"></script>
   ============================================================================ */

// Estado atual do filtro: começa em "todos" -> loja abre sem filtro nenhum
let currentCategory = "todos";
// Estado atual da busca (texto digitado na barra de pesquisa)
let currentSearchTerm = "";

/* ============================================================================
   RENDERIZAÇÃO DOS JOGOS
   ============================================================================ */
function renderGames() {
  const list = document.getElementById("gameList");
  const titleEl = document.getElementById("gameListTitle");
  const countEl = document.getElementById("gameListCount");

  // 1) Filtra por categoria (ou mantém tudo, se "todos")
  let filtered = STORE_GAMES.filter(
    (g) => currentCategory === "todos" || g.categoria === currentCategory
  );

  // 2) Filtra também pelo texto da busca (no título ou nas tags)
  if (currentSearchTerm.trim() !== "") {
    const term = currentSearchTerm.trim().toLowerCase();
    filtered = filtered.filter(
      (g) =>
        g.title.toLowerCase().includes(term) ||
        g.tags.some((t) => t.toLowerCase().includes(term))
    );
  }

  // 3) Atualiza o título da janela ("Mostrando: Ação", etc.)
  titleEl.textContent = `🎮 ${CATEGORY_LABELS[currentCategory] || "Jogos"}`;
  countEl.textContent = `${filtered.length} jogo(s)`;

  // 4) Monta o HTML de cada card a partir dos dados (nada fixo no HTML!)
  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state">Nenhum jogo encontrado com esse filtro 🛸</div>`;
    return;
  }

  list.innerHTML = filtered
    .map(
      (g) => `
      <div class="game-card" onclick="goTo('steamwave.html')">
        <div class="game-thumb" style="${g.thumbBg ? `background:${g.thumbBg}` : ""}">${g.emoji}</div>
        <div class="game-info">
          <div class="game-title">${g.title}</div>
          <div class="game-desc">${g.desc}</div>
          <span class="game-price">${g.price}</span>
          <div class="game-tags">
            ${g.tags.map((tag) => `<span class="game-tag">${tag}</span>`).join("")}
          </div>
        </div>
      </div>
    `
    )
    .join("");
}

/* ============================================================================
   RENDERIZAÇÃO DA SIDEBAR (DLCs e Soundtracks)
   ============================================================================ */
function renderDlcs() {
  const el = document.getElementById("dlcList");
  el.innerHTML = STORE_DLCS.map(
    (d) => `
      <div class="side-item" onclick="goTo('dlc.html?id=${d.id}')">
        <span class="side-emoji">${d.emoji}</span>
        <div class="side-info">
          <div class="side-name">${d.name}</div>
          <div class="side-sub">${d.gameTitle} · ${d.free ? "Grátis" : d.price}</div>
        </div>
      </div>
    `
  ).join("");
}

function renderSoundtracks() {
  const el = document.getElementById("soundtrackList");
  el.innerHTML = STORE_SOUNDTRACKS.map(
    (s) => `
      <div class="side-item" onclick="goTo('soundtrack.html?id=${s.id}')">
        <span class="side-emoji">${s.emoji}</span>
        <div class="side-info">
          <div class="side-name">${s.track}</div>
          <div class="side-sub">${s.gameTitle} · ${s.free ? "Grátis" : "Pago"}</div>
        </div>
      </div>
    `
  ).join("");
}

/* ============================================================================
   FILTRO DE CATEGORIA (clicável)
   ============================================================================ */
function filterCategory(categoria, btnEl) {
  currentCategory = categoria;

  // Marca visualmente só o botão clicado como "active"
  document.querySelectorAll(".cat-btn").forEach((b) => b.classList.remove("active"));
  btnEl.classList.add("active");

  renderGames();
}

/* ============================================================================
   TOAST (igual ao resto do site)
   ============================================================================ */
let toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
}

/* ===== BUSCA ===== */
function toggleSearch() {
  const bar = document.getElementById("searchBar");
  bar.classList.toggle("open");
  if (bar.classList.contains("open")) {
    bar.querySelector("input").focus();
  }
}

// Atualiza a busca em tempo real conforme o usuário digita
function onSearchInput(value) {
  currentSearchTerm = value;
  renderGames();
}

/* ===== NAVEGAÇÃO ===== */
function goTo(url) {
  window.location.href = url;
}

/* ============================================================================
   INICIALIZAÇÃO
   Quando a página carrega: renderiza tudo SEM filtro nenhum (todos os jogos),
   exatamente como o pedido original — "quando você entra na loja, mostra
   todos os jogos sem filtro".
   ============================================================================ */
document.addEventListener("DOMContentLoaded", () => {
  renderGames();
  renderDlcs();
  renderSoundtracks();

  // Liga o input de busca ao filtro em tempo real
  const searchInput = document.querySelector("#searchBar input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => onSearchInput(e.target.value));
  }
});
