/* ============================================================================
   SCRIPTDLC.JS
   Lógica da página de compra de uma DLC específica.

   Como funciona:
   1) Lê o "id" da URL (ex: dlc.html?id=neoncat-skins)
   2) Procura esse id dentro de STORE_DLCS (vem de storeData.js)
   3) Renderiza os detalhes — se for grátis, mostra botão "Adicionar à
      Biblioteca"; se for paga, mostra o preço e o botão "Comprar"
   ============================================================================ */

// ===== TOAST (mesmo padrão usado no resto do site) =====
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

// Lê o parâmetro "id" da URL atual (ex.: ?id=neoncat-skins -> "neoncat-skins")
function getIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

/* ============================================================================
   SIMULAÇÃO DE COMPRA / ADIÇÃO
   Por enquanto isso é só um mock (mostra um toast). Quando o backend no
   Azure existir, aqui é o lugar certo pra trocar por uma chamada real, tipo:

     async function comprarDlc(dlcId) {
       const resp = await fetch(`${API_BASE_URL}/api/compras/dlc`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ dlcId, usuarioId: USUARIO_ATUAL_ID }),
       });
       // ...tratar resposta, atualizar biblioteca, etc.
     }
   ============================================================================ */
function comprarOuAdicionarDlc(dlcId) {
  const dlc = STORE_DLCS.find((d) => d.id === dlcId);
  if (!dlc) return;
  if (dlc.free) {
    showToast(`✅ "${dlc.name}" adicionada à sua biblioteca!`);
  } else {
    showToast(`💳 Compra de "${dlc.name}" confirmada — ${dlc.price}`);
  }
  // TODO (Azure): chamar a API de compras aqui e atualizar o estado real
  // de "o que o usuário possui" assim que o backend existir.
}

/* ============================================================================
   RENDERIZAÇÃO DA PÁGINA
   ============================================================================ */
function renderDlcPage() {
  const id = getIdFromUrl();
  const dlc = STORE_DLCS.find((d) => d.id === id);
  const content = document.getElementById("dlcContent");

  // Caso alguém acesse a página sem um id válido (link quebrado, digitou
  // a URL errado, etc.) — mostra um estado vazio em vez de quebrar a página.
  if (!dlc) {
    content.innerHTML = `
      <div class="empty-state">
        DLC não encontrada. <br />
        <button class="cat-btn" style="margin-top: 10px;" onclick="goTo('loja.html')">Voltar à loja</button>
      </div>
    `;
    return;
  }

  document.getElementById("dlcWindowTitle").textContent = `💿 ${dlc.name}`;
  document.title = `${dlc.name} - SteamWave`;

  // Tag de preço: verde "GRÁTIS" se for de graça, ciano com o preço se for paga
  const priceTagHtml = dlc.free
    ? `<span class="price-tag free">GRÁTIS</span>`
    : `<span class="price-tag paid">${dlc.price}</span>`;

  // Texto e ação do botão mudam conforme o item ser grátis ou pago
  const buttonLabel = dlc.free ? "➕ Adicionar à Biblioteca" : `🛒 Comprar — ${dlc.price}`;

  content.innerHTML = `
    <div class="product-page">
      <div class="product-cover">${dlc.emoji}</div>
      <div class="product-info">
        <div class="product-game">Para: ${dlc.gameTitle}</div>
        <h2 class="product-title">${dlc.name}</h2>
        ${priceTagHtml}
        <p class="product-desc">${dlc.desc}</p>
        <button class="buy-btn ${dlc.free ? "buy-btn-free" : ""}" onclick="comprarOuAdicionarDlc('${dlc.id}')">
          ${buttonLabel}
        </button>
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", renderDlcPage);
