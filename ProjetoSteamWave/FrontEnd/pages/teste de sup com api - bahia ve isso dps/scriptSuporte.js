/* =========================================================
   STEAMWAVE — scriptSuporte.js
   
   Funções exportadas / globais:
     goTo(pageId)           — navegação entre páginas
     showToast(msg, type)   — notificação temporária
     toggleFaq(el)          — acordeão de perguntas
   
   Módulos internos:
     TicketAPI              — camada de integração Go + MongoDB
     TicketForm             — criação de tickets com validação
     TicketList             — listagem e filtros
     TicketModal            — detalhe e resposta de ticket
   ========================================================= */

"use strict";

/* ─────────────────────────────────────────────────────────
   CONFIG
   Troque BASE_URL pela URL do seu servidor Go em produção.
   Em desenvolvimento, use o proxy ou defina a variável de
   ambiente via Vite/Webpack se aplicável.
   ───────────────────────────────────────────────────────── */
const CONFIG = {
  BASE_URL:      window.__STEAMWAVE_API_URL__ || "http://localhost:8080",
  ENDPOINTS: {
    tickets:       "/api/v1/tickets",
    ticketById:    (id) => `/api/v1/tickets/${id}`,
    ticketReply:   (id) => `/api/v1/tickets/${id}/messages`,
    categories:    "/api/v1/tickets/categories",
  },
  TOAST_DURATION: 3500,   // ms
  MAX_MSG_LENGTH: 1000,   // chars (sincronize com validação Go)
  POLL_INTERVAL:  30000,  // ms — recarrega a lista de tickets abertos
};

/* ─────────────────────────────────────────────────────────
   NAVEGAÇÃO
   ───────────────────────────────────────────────────────── */

/**
 * Esconde todas as .page e exibe apenas a de id `pageId`.
 * @param {string} pageId — id do <div class="page"> alvo
 */
function goTo(pageId) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".gnav-btn").forEach((b) => b.classList.remove("active"));

  const target = document.getElementById(pageId);
  if (target) target.classList.add("active");
}

/* ─────────────────────────────────────────────────────────
   TOAST
   ───────────────────────────────────────────────────────── */

let _toastTimer = null;

/**
 * Exibe uma notificação deslizante por CONFIG.TOAST_DURATION ms.
 * @param {string} msg  — texto a exibir
 * @param {"info"|"success"|"error"} [type="info"]
 */
function showToast(msg, type = "info") {
  const el = document.getElementById("toast");
  if (!el) return;

  // limpa classes de tipo anteriores
  el.classList.remove("toast-success", "toast-error", "toast-info");
  el.classList.add(`toast-${type}`);

  el.textContent = msg;
  el.classList.add("show");

  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove("show"), CONFIG.TOAST_DURATION);
}

/* ─────────────────────────────────────────────────────────
   FAQ — acordeão
   ───────────────────────────────────────────────────────── */

/**
 * Abre/fecha a resposta do FAQ.
 * @param {HTMLElement} el — elemento .faq-q clicado
 */
function toggleFaq(el) {
  const answer = el.nextElementSibling;
  const isOpen = answer.classList.toggle("open");

  el.querySelector("span:last-child").textContent = isOpen ? "▲" : "▼";
  el.setAttribute("aria-expanded", String(isOpen));
}

/* ─────────────────────────────────────────────────────────
   TICKET API — camada de integração Go + MongoDB
   
   Todos os métodos retornam Promise.
   O token de autenticação é lido de sessionStorage/localStorage
   (definido pelo módulo auth.js existente).
   ───────────────────────────────────────────────────────── */

const TicketAPI = (() => {
  /* recupera o JWT do usuário logado (gerado pelo auth.js) */
  function _getAuthToken() {
    return (
      sessionStorage.getItem("sw_token") ||
      localStorage.getItem("sw_token")   ||
      ""
    );
  }

  function _headers(extra = {}) {
    const token = _getAuthToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra,
    };
  }

  /**
   * Faz uma request para a API Go e retorna o JSON parseado.
   * Lança um Error com a mensagem da API em caso de status ≥ 400.
   */
  async function _request(method, path, body = null) {
    const url = `${CONFIG.BASE_URL}${path}`;
    const opts = { method, headers: _headers() };
    if (body) opts.body = JSON.stringify(body);

    let res;
    try {
      res = await fetch(url, opts);
    } catch (err) {
      // erro de rede / servidor indisponível
      throw new Error("Não foi possível conectar ao servidor. Verifique sua conexão.");
    }

    /* tenta parsear o JSON mesmo em erros para pegar a mensagem da API */
    let data;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      data = await res.json();
    } else {
      data = { message: await res.text() };
    }

    if (!res.ok) {
      throw new Error(data.message || data.error || `Erro ${res.status}`);
    }

    return data;
  }

  /* ── métodos públicos ────────────────────────────────── */

  /**
   * Cria um novo ticket.
   * 
   * Payload esperado pelo Go:
   * {
   *   subject:  string (3–120 chars)
   *   message:  string (10–1000 chars)
   *   category: string  (slug da categoria, ex: "reembolso")
   *   user_id:  string  (ObjectId — injetado pelo middleware de auth no server)
   * }
   * 
   * Resposta esperada do Go (201 Created):
   * {
   *   id:         string  (ObjectId MongoDB como hex string)
   *   ticket_ref: string  (ex: "SW-20240601-00042")
   *   subject:    string
   *   status:     string  ("aberto")
   *   created_at: string  (ISO 8601)
   * }
   */
  async function createTicket({ subject, message, category }) {
    return _request("POST", CONFIG.ENDPOINTS.tickets, { subject, message, category });
  }

  /**
   * Lista os tickets do usuário autenticado.
   * 
   * Query params suportados pelo Go:
   *   status   = "aberto" | "em-andamento" | "resolvido" | "fechado" | "" (todos)
   *   page     = 1-based
   *   per_page = default 20
   *   search   = busca textual em subject
   * 
   * Resposta esperada (200 OK):
   * {
   *   tickets: Ticket[]
   *   total:   number
   *   page:    number
   *   pages:   number
   * }
   */
  async function listTickets({ status = "", page = 1, search = "" } = {}) {
    const qs = new URLSearchParams();
    if (status) qs.set("status", status);
    if (search) qs.set("search", search);
    qs.set("page", String(page));
    qs.set("per_page", "20");

    const path = `${CONFIG.ENDPOINTS.tickets}?${qs.toString()}`;
    return _request("GET", path);
  }

  /**
   * Busca um ticket pelo id (ObjectId hex).
   * 
   * Resposta esperada (200 OK):
   * {
   *   id:         string
   *   ticket_ref: string
   *   subject:    string
   *   category:   string
   *   status:     string
   *   created_at: string
   *   updated_at: string
   *   messages: [
   *     {
   *       id:         string
   *       author:     "user" | "support"
   *       author_name:string
   *       text:       string
   *       created_at: string
   *     }
   *   ]
   * }
   */
  async function getTicket(id) {
    return _request("GET", CONFIG.ENDPOINTS.ticketById(id));
  }

  /**
   * Envia uma nova mensagem em um ticket existente.
   * 
   * Payload:
   * { text: string (1–1000 chars) }
   * 
   * Resposta esperada (201 Created):
   * { message: { id, author, text, created_at } }
   */
  async function replyToTicket(ticketId, text) {
    return _request("POST", CONFIG.ENDPOINTS.ticketReply(ticketId), { text });
  }

  /**
   * Busca as categorias de ticket disponíveis.
   * 
   * Resposta esperada (200 OK):
   * { categories: [{ slug: string, label: string }] }
   * 
   * Fallback local usado se o endpoint ainda não existir.
   */
  async function getCategories() {
    try {
      return _request("GET", CONFIG.ENDPOINTS.categories);
    } catch {
      // fallback enquanto o endpoint não está pronto
      return {
        categories: [
          { slug: "conta",       label: "Conta e Acesso"    },
          { slug: "pagamento",   label: "Pagamento"         },
          { slug: "reembolso",   label: "Reembolso"         },
          { slug: "jogo",        label: "Problema em Jogo"  },
          { slug: "tecnico",     label: "Suporte Técnico"   },
          { slug: "outro",       label: "Outro"             },
        ],
      };
    }
  }

  return { createTicket, listTickets, getTicket, replyToTicket, getCategories };
})();

/* ─────────────────────────────────────────────────────────
   TICKET FORM
   ───────────────────────────────────────────────────────── */

const TicketForm = (() => {
  let _initialized = false;

  function _els() {
    return {
      form:      document.getElementById("ticket-form"),
      subject:   document.getElementById("ticket-subject"),
      category:  document.getElementById("ticket-category"),
      message:   document.getElementById("ticket-message"),
      charCount: document.getElementById("char-count"),
      charMax:   document.getElementById("char-max"),
      submitBtn: document.getElementById("ticket-submit"),
      errorBox:  document.getElementById("form-error"),
    };
  }

  /* popula o <select> de categorias via API */
  async function _loadCategories() {
    const { category } = _els();
    if (!category) return;

    try {
      const data = await TicketAPI.getCategories();
      category.innerHTML = '<option value="">Selecione uma categoria</option>';
      (data.categories || []).forEach((c) => {
        const opt = document.createElement("option");
        opt.value       = c.slug;
        opt.textContent = c.label;
        category.appendChild(opt);
      });
    } catch {
      // o fallback já é retornado por getCategories()
    }
  }

  function _setError(msg) {
    const { errorBox } = _els();
    if (!errorBox) return;
    errorBox.textContent = msg;
    errorBox.classList.toggle("visible", !!msg);
  }

  function _setLoading(loading) {
    const { submitBtn } = _els();
    if (!submitBtn) return;

    if (loading) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="btn-spinner"></span>ENVIANDO...';
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = "ENVIAR TICKET";
    }
  }

  function _validate(subject, category, message) {
    if (!subject || subject.length < 3)
      return "O assunto deve ter pelo menos 3 caracteres.";
    if (subject.length > 120)
      return "O assunto deve ter no máximo 120 caracteres.";
    if (!category)
      return "Selecione uma categoria para o seu problema.";
    if (!message || message.length < 10)
      return "Descreva o problema com pelo menos 10 caracteres.";
    if (message.length > CONFIG.MAX_MSG_LENGTH)
      return `A mensagem não pode ter mais de ${CONFIG.MAX_MSG_LENGTH} caracteres.`;
    return null;
  }

  async function _handleSubmit(e) {
    e.preventDefault();
    const { subject, category, message } = _els();

    const subjectVal  = subject.value.trim();
    const categoryVal = category.value;
    const messageVal  = message.value.trim();

    const validationError = _validate(subjectVal, categoryVal, messageVal);
    if (validationError) {
      _setError(validationError);
      return;
    }

    _setError("");
    _setLoading(true);

    try {
      const result = await TicketAPI.createTicket({
        subject:  subjectVal,
        message:  messageVal,
        category: categoryVal,
      });

      /* limpa o formulário */
      subject.value  = "";
      category.value = "";
      message.value  = "";
      _updateCharCount(0);

      showToast(
        `✅ Ticket ${result.ticket_ref || ""} aberto com sucesso!`,
        "success"
      );

      /* muda para a aba "Meus Tickets" e recarrega a lista */
      switchTab("tab-tickets");
      TicketList.load();
    } catch (err) {
      _setError(err.message || "Erro ao enviar ticket. Tente novamente.");
      showToast("❌ Erro ao enviar ticket.", "error");
    } finally {
      _setLoading(false);
    }
  }

  function _updateCharCount(length) {
    const { charCount, charMax } = _els();
    if (!charCount) return;
    charCount.textContent = length;
    if (charMax) charMax.textContent = CONFIG.MAX_MSG_LENGTH;
    charCount.parentElement?.classList.toggle("over", length > CONFIG.MAX_MSG_LENGTH);
  }

  function init() {
    if (_initialized) return;
    _initialized = true;

    const { form, message } = _els();
    if (!form) return;

    form.addEventListener("submit", _handleSubmit);

    if (message) {
      message.addEventListener("input", () => _updateCharCount(message.value.length));
      _updateCharCount(0);
    }

    _loadCategories();
  }

  return { init };
})();

/* ─────────────────────────────────────────────────────────
   TICKET LIST
   ───────────────────────────────────────────────────────── */

const TicketList = (() => {
  let _currentStatus = "";
  let _currentSearch = "";
  let _pollHandle    = null;
  let _initialized   = false;

  function _els() {
    return {
      list:   document.getElementById("tickets-list"),
      empty:  document.getElementById("tickets-empty"),
      loading:document.getElementById("tickets-loading"),
      search: document.getElementById("tickets-search"),
      filter: document.getElementById("tickets-filter"),
    };
  }

  const STATUS_LABELS = {
    "aberto":        "Aberto",
    "em-andamento":  "Em andamento",
    "resolvido":     "Resolvido",
    "fechado":       "Fechado",
  };

  const STATUS_CSS = {
    "aberto":        "status-aberto",
    "em-andamento":  "status-em-andamento",
    "resolvido":     "status-resolvido",
    "fechado":       "status-fechado",
  };

  function _setLoading(show) {
    const { loading, list } = _els();
    if (loading) loading.style.display = show ? "flex" : "none";
    if (list)    list.style.display    = show ? "none" : "flex";
  }

  function _formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return iso || "";
    }
  }

  function _renderCard(ticket) {
    const card = document.createElement("div");
    card.className = "ticket-card";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `Ticket ${ticket.ticket_ref}: ${ticket.subject}`);

    card.innerHTML = `
      <div class="ticket-card-header">
        <span class="ticket-id">${ticket.ticket_ref || ticket.id}</span>
        <span class="ticket-status ${STATUS_CSS[ticket.status] || "status-aberto"}">
          ${STATUS_LABELS[ticket.status] || ticket.status}
        </span>
      </div>
      <div class="ticket-subject">${_escapeHtml(ticket.subject)}</div>
      <div class="ticket-meta">
        <span class="ticket-category">${ticket.category || ""}</span>
        <span class="ticket-date">${_formatDate(ticket.created_at)}</span>
      </div>
    `;

    const open = () => TicketModal.open(ticket.id);
    card.addEventListener("click",  open);
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") open(); });

    return card;
  }

  function _escapeHtml(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str || ""));
    return div.innerHTML;
  }

  async function load() {
    const { list, empty } = _els();
    if (!list) return;

    _setLoading(true);

    try {
      const data = await TicketAPI.listTickets({
        status: _currentStatus,
        search: _currentSearch,
      });

      const tickets = data.tickets || [];
      list.innerHTML = "";

      if (tickets.length === 0) {
        if (empty) empty.style.display = "block";
      } else {
        if (empty) empty.style.display = "none";
        tickets.forEach((t) => list.appendChild(_renderCard(t)));
      }
    } catch (err) {
      if (empty) {
        empty.style.display = "block";
        empty.textContent   = "Não foi possível carregar os tickets.";
      }
      showToast("❌ " + (err.message || "Erro ao carregar tickets."), "error");
    } finally {
      _setLoading(false);
    }
  }

  function _startPolling() {
    _stopPolling();
    _pollHandle = setInterval(() => {
      /* só recarrega se a aba de tickets estiver visível */
      const ticketPanel = document.getElementById("tab-tickets");
      if (ticketPanel?.classList.contains("active")) load();
    }, CONFIG.POLL_INTERVAL);
  }

  function _stopPolling() {
    if (_pollHandle) { clearInterval(_pollHandle); _pollHandle = null; }
  }

  let _searchDebounce = null;
  function _onSearch() {
    clearTimeout(_searchDebounce);
    _searchDebounce = setTimeout(() => {
      _currentSearch = document.getElementById("tickets-search")?.value.trim() || "";
      load();
    }, 350);
  }

  function init() {
    if (_initialized) return;
    _initialized = true;

    const { search, filter } = _els();
    search?.addEventListener("input", _onSearch);
    filter?.addEventListener("change", (e) => {
      _currentStatus = e.target.value;
      load();
    });

    _startPolling();
  }

  return { init, load };
})();

/* ─────────────────────────────────────────────────────────
   TICKET MODAL — detalhe e resposta
   ───────────────────────────────────────────────────────── */

const TicketModal = (() => {
  let _currentTicketId = null;

  function _overlay() { return document.getElementById("ticket-modal-overlay"); }

  function _escapeHtml(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str || ""));
    return div.innerHTML;
  }

  function _formatDate(iso) {
    try {
      return new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return iso || ""; }
  }

  function _render(ticket) {
    const STATUS_LABELS = {
      "aberto": "Aberto", "em-andamento": "Em andamento",
      "resolvido": "Resolvido", "fechado": "Fechado",
    };
    const STATUS_CSS = {
      "aberto": "status-aberto", "em-andamento": "status-em-andamento",
      "resolvido": "status-resolvido", "fechado": "status-fechado",
    };

    /* mensagens */
    const msgs = (ticket.messages || []).map((m) => `
      <div class="ticket-msg ${m.author === "user" ? "user" : "support"}">
        <div class="ticket-msg-author">${_escapeHtml(m.author_name || m.author)}</div>
        <div class="ticket-msg-text">${_escapeHtml(m.text)}</div>
        <div class="ticket-msg-time">${_formatDate(m.created_at)}</div>
      </div>
    `).join("");

    /* se resolvido/fechado, esconde caixa de resposta */
    const canReply = !["resolvido", "fechado"].includes(ticket.status);

    return `
      <div class="win-window ticket-modal">
        <div class="win-titlebar">
          <span>📋 ${_escapeHtml(ticket.ticket_ref || ticket.id)}</span>
          <div class="win-controls">
            <div class="win-btn" id="modal-close-btn">✕</div>
          </div>
        </div>
        <div class="ticket-modal-body">
          <div class="ticket-detail-row">
            <span class="ticket-detail-label">ASSUNTO</span>
            <span class="ticket-detail-value">${_escapeHtml(ticket.subject)}</span>
          </div>
          <div class="ticket-detail-row">
            <span class="ticket-detail-label">CATEGORIA</span>
            <span class="ticket-detail-value">${_escapeHtml(ticket.category || "—")}</span>
          </div>
          <div class="ticket-detail-row">
            <span class="ticket-detail-label">STATUS</span>
            <span class="ticket-detail-value">
              <span class="ticket-status ${STATUS_CSS[ticket.status] || "status-aberto"}">
                ${STATUS_LABELS[ticket.status] || ticket.status}
              </span>
            </span>
          </div>
          <div class="ticket-detail-row">
            <span class="ticket-detail-label">ABERTO EM</span>
            <span class="ticket-detail-value">${_formatDate(ticket.created_at)}</span>
          </div>

          <div class="ticket-messages" id="modal-messages">
            ${msgs || '<p style="font-family:var(--pixel-font);font-size:7px;color:#888">Sem mensagens.</p>'}
          </div>

          ${canReply ? `
          <div class="ticket-reply-box">
            <textarea class="ticket-reply-input" id="modal-reply-input"
              placeholder="Escreva sua resposta..." maxlength="${CONFIG.MAX_MSG_LENGTH}"></textarea>
            <div class="ticket-reply-actions">
              <button class="btn-secondary" id="modal-close-btn2">FECHAR</button>
              <button class="btn-primary"   id="modal-reply-btn">RESPONDER</button>
            </div>
          </div>
          ` : `
          <p style="font-family:var(--pixel-font);font-size:6px;color:#888;padding-top:8px">
            Este ticket está ${STATUS_LABELS[ticket.status]?.toLowerCase() || ticket.status} e não aceita novas respostas.
          </p>
          `}
        </div>
      </div>
    `;
  }

  async function open(ticketId) {
    _currentTicketId = ticketId;
    const overlay = _overlay();
    if (!overlay) return;

    overlay.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;color:white;font-family:var(--pixel-font);font-size:8px">
        <div class="spinner" style="width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:spin 0.7s linear infinite"></div>
        CARREGANDO...
      </div>
    `;
    overlay.classList.add("visible");

    try {
      const ticket = await TicketAPI.getTicket(ticketId);
      overlay.innerHTML = _render(ticket);

      /* scroll automático para as mensagens mais recentes */
      const msgs = overlay.querySelector("#modal-messages");
      if (msgs) msgs.scrollTop = msgs.scrollHeight;

      /* eventos internos do modal */
      overlay.querySelector("#modal-close-btn")?.addEventListener("click",  close);
      overlay.querySelector("#modal-close-btn2")?.addEventListener("click", close);
      overlay.querySelector("#modal-reply-btn")?.addEventListener("click",  _handleReply);

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close();
      }, { once: true });
    } catch (err) {
      overlay.innerHTML = `
        <div class="win-window" style="padding:24px;max-width:360px;text-align:center">
          <p style="font-family:var(--pixel-font);font-size:8px;color:#cc0000;margin-bottom:16px">
            ❌ ${_escapeHtml(err.message || "Erro ao carregar ticket.")}
          </p>
          <button class="btn-secondary" onclick="TicketModal.close()">FECHAR</button>
        </div>
      `;
    }
  }

  async function _handleReply() {
    const input = document.getElementById("modal-reply-input");
    if (!input) return;

    const text = input.value.trim();
    if (!text) { showToast("⚠️ Digite uma mensagem antes de responder.", "info"); return; }
    if (text.length > CONFIG.MAX_MSG_LENGTH) {
      showToast(`⚠️ Máximo de ${CONFIG.MAX_MSG_LENGTH} caracteres.`, "info");
      return;
    }

    const btn = document.getElementById("modal-reply-btn");
    if (btn) { btn.disabled = true; btn.textContent = "ENVIANDO..."; }

    try {
      await TicketAPI.replyToTicket(_currentTicketId, text);
      showToast("✅ Resposta enviada!", "success");
      /* recarrega o modal com as mensagens atualizadas */
      await open(_currentTicketId);
    } catch (err) {
      showToast("❌ " + (err.message || "Erro ao enviar resposta."), "error");
      if (btn) { btn.disabled = false; btn.textContent = "RESPONDER"; }
    }
  }

  function close() {
    const overlay = _overlay();
    if (overlay) overlay.classList.remove("visible");
    _currentTicketId = null;
  }

  return { open, close };
})();

/* ─────────────────────────────────────────────────────────
   ABAS (Form / Meus Tickets)
   ───────────────────────────────────────────────────────── */

/**
 * Muda a aba ativa na janela de suporte.
 * @param {"tab-form"|"tab-tickets"} tabId
 */
function switchTab(tabId) {
  document.querySelectorAll(".suporte-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.tab === tabId);
  });
  document.querySelectorAll(".tab-panel").forEach((p) => {
    p.classList.toggle("active", p.id === tabId);
  });

  /* carrega a lista quando a aba de tickets é aberta */
  if (tabId === "tab-tickets") TicketList.load();
}

/* ─────────────────────────────────────────────────────────
   ATALHO ESC
   ───────────────────────────────────────────────────────── */

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;

  /* fecha o modal de ticket se estiver aberto */
  const overlay = document.getElementById("ticket-modal-overlay");
  if (overlay?.classList.contains("visible")) {
    TicketModal.close();
    return;
  }

  /* comportamento original: fecha subpainel */
  const panel = document.getElementById("subPanel");
  if (panel?.classList.contains("open")) panel.classList.remove("open");
});

/* ─────────────────────────────────────────────────────────
   INICIALIZAÇÃO
   ───────────────────────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", () => {
  TicketForm.init();
  TicketList.init();

  /* abas */
  document.querySelectorAll(".suporte-tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });
});

/* expõe funções globais necessárias para onclick inline no HTML */
window.goTo       = goTo;
window.showToast  = showToast;
window.toggleFaq  = toggleFaq;
window.switchTab  = switchTab;
window.TicketModal = TicketModal;
