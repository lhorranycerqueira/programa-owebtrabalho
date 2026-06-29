/* =========================================================
   STEAMWAVE — scriptSuporte.js
   Funciona 100% offline via localStorage.
   Quando o backend Go estiver pronto, basta trocar
   TicketStorage pelos métodos de TicketAPI (fetch).
   ========================================================= */

"use strict";

const CONFIG = {
  TOAST_DURATION: 3500,
  MAX_MSG_LENGTH: 1000,
  CATEGORIES: [
    { slug: "conta",     label: "Conta e Acesso"   },
    { slug: "pagamento", label: "Pagamento"         },
    { slug: "reembolso", label: "Reembolso"         },
    { slug: "jogo",      label: "Problema em Jogo"  },
    { slug: "tecnico",   label: "Suporte Técnico"   },
    { slug: "outro",     label: "Outro"             },
  ],
};

/* ─────────────────────────────────────────────────────────
   STORAGE LOCAL — simula o banco de dados
   Estrutura em localStorage:
     sw_tickets : Ticket[]
   ───────────────────────────────────────────────────────── */

const TicketStorage = (() => {
  const KEY = "sw_tickets";

  function _load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }

  function _save(tickets) {
    localStorage.setItem(KEY, JSON.stringify(tickets));
  }

  function _genId() {
    return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
  }

  function _genRef() {
    const all = _load();
    const n   = String(all.length + 1).padStart(5, "0");
    const d   = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `SW-${d}-${n}`;
  }

  /* cria um novo ticket e retorna ele */
  function create({ subject, message, category }) {
    const tickets = _load();
    const now     = new Date().toISOString();
    const ticket  = {
      id:         _genId(),
      ticket_ref: _genRef(),
      subject,
      category,
      status:     "aberto",
      created_at: now,
      updated_at: now,
      messages: [
        {
          id:          _genId(),
          author:      "user",
          author_name: "Você",
          text:        message,
          created_at:  now,
        },
      ],
    };
    tickets.unshift(ticket);
    _save(tickets);
    return ticket;
  }

  /* lista com filtros opcionais */
  function list({ status = "", search = "" } = {}) {
    let tickets = _load();
    if (status) tickets = tickets.filter((t) => t.status === status);
    if (search) {
      const q = search.toLowerCase();
      tickets  = tickets.filter((t) => t.subject.toLowerCase().includes(q));
    }
    return { tickets, total: tickets.length };
  }

  /* busca pelo id */
  function getById(id) {
    const ticket = _load().find((t) => t.id === id);
    if (!ticket) throw new Error("Ticket não encontrado.");
    return ticket;
  }

  /* adiciona uma mensagem a um ticket e retorna o ticket atualizado */
  function addMessage(ticketId, text) {
    const tickets = _load();
    const idx     = tickets.findIndex((t) => t.id === ticketId);
    if (idx === -1) throw new Error("Ticket não encontrado.");

    const ticket = tickets[idx];
    if (["resolvido", "fechado"].includes(ticket.status)) {
      throw new Error("Este ticket está encerrado e não aceita novas respostas.");
    }

    const now = new Date().toISOString();
    ticket.messages.push({
      id:          Math.random().toString(36).slice(2),
      author:      "user",
      author_name: "Você",
      text,
      created_at:  now,
    });
    ticket.updated_at = now;
    tickets[idx] = ticket;
    _save(tickets);

    /* simula resposta automática do suporte após 1,5s */
    setTimeout(() => _autoReply(ticketId), 1500);

    return ticket;
  }

  /* resposta automática simulada do suporte */
  function _autoReply(ticketId) {
    const respostas = [
      "Obrigado pelo contato! Estamos analisando sua solicitação.",
      "Recebemos sua mensagem e retornaremos em breve.",
      "Sua solicitação foi registrada. Nossa equipe irá verificar.",
    ];
    const tickets = _load();
    const idx     = tickets.findIndex((t) => t.id === ticketId);
    if (idx === -1) return;

    const now = new Date().toISOString();
    tickets[idx].messages.push({
      id:          Math.random().toString(36).slice(2),
      author:      "support",
      author_name: "Suporte SteamWave",
      text:        respostas[Math.floor(Math.random() * respostas.length)],
      created_at:  now,
    });
    tickets[idx].status     = "em-andamento";
    tickets[idx].updated_at = now;
    _save(tickets);
  }

  return { create, list, getById, addMessage };
})();

/* ─────────────────────────────────────────────────────────
   NAVEGAÇÃO
   ───────────────────────────────────────────────────────── */

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

function showToast(msg, type = "info") {
  const el = document.getElementById("toast");
  if (!el) return;
  el.classList.remove("toast-success", "toast-error", "toast-info");
  el.classList.add(`toast-${type}`);
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove("show"), CONFIG.TOAST_DURATION);
}

/* ─────────────────────────────────────────────────────────
   FAQ
   ───────────────────────────────────────────────────────── */

function toggleFaq(el) {
  const answer = el.nextElementSibling;
  const isOpen = answer.classList.toggle("open");
  el.querySelector("span:last-child").textContent = isOpen ? "▲" : "▼";
  el.setAttribute("aria-expanded", String(isOpen));
}

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
      submitBtn: document.getElementById("ticket-submit"),
      errorBox:  document.getElementById("form-error"),
    };
  }

  function _loadCategories() {
    const { category } = _els();
    if (!category) return;
    category.innerHTML = '<option value="">Selecione uma categoria</option>';
    CONFIG.CATEGORIES.forEach((c) => {
      const opt       = document.createElement("option");
      opt.value       = c.slug;
      opt.textContent = c.label;
      category.appendChild(opt);
    });
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
      submitBtn.disabled   = true;
      submitBtn.innerHTML  = '<span class="btn-spinner"></span>ENVIANDO...';
    } else {
      submitBtn.disabled   = false;
      submitBtn.textContent = "ENVIAR TICKET";
    }
  }

  function _validate(subject, category, message) {
    if (!subject || subject.length < 3)
      return "O assunto deve ter pelo menos 3 caracteres.";
    if (subject.length > 120)
      return "O assunto deve ter no máximo 120 caracteres.";
    if (!category)
      return "Selecione uma categoria.";
    if (!message || message.length < 10)
      return "Descreva o problema com pelo menos 10 caracteres.";
    if (message.length > CONFIG.MAX_MSG_LENGTH)
      return `A mensagem não pode ter mais de ${CONFIG.MAX_MSG_LENGTH} caracteres.`;
    return null;
  }

  function _handleSubmit(e) {
    e.preventDefault();
    const { subject, category, message } = _els();

    const subjectVal  = subject.value.trim();
    const categoryVal = category.value;
    const messageVal  = message.value.trim();

    const err = _validate(subjectVal, categoryVal, messageVal);
    if (err) { _setError(err); return; }

    _setError("");
    _setLoading(true);

    /* pequeno delay pra dar sensação de processamento */
    setTimeout(() => {
      try {
        const result = TicketStorage.create({
          subject:  subjectVal,
          message:  messageVal,
          category: categoryVal,
        });

        subject.value  = "";
        category.value = "";
        message.value  = "";
        _updateCharCount(0);

        showToast(`✅ Ticket ${result.ticket_ref} aberto!`, "success");
        switchTab("tab-tickets");
        TicketList.load();
      } catch (ex) {
        _setError(ex.message || "Erro ao abrir ticket.");
      } finally {
        _setLoading(false);
      }
    }, 600);
  }

  function _updateCharCount(len) {
    const { charCount } = _els();
    if (!charCount) return;
    charCount.textContent = len;
    charCount.parentElement?.classList.toggle("over", len > CONFIG.MAX_MSG_LENGTH);
  }

  function init() {
    if (_initialized) return;
    _initialized = true;
    const { form, message } = _els();
    if (!form) return;
    form.addEventListener("submit", _handleSubmit);
    message?.addEventListener("input", () => _updateCharCount(message.value.length));
    _updateCharCount(0);
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
  let _initialized   = false;

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

  function _formatDate(iso) {
    try {
      return new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return iso || ""; }
  }

  function _escapeHtml(str) {
    const d = document.createElement("div");
    d.appendChild(document.createTextNode(str || ""));
    return d.innerHTML;
  }

  function _categoryLabel(slug) {
    return CONFIG.CATEGORIES.find((c) => c.slug === slug)?.label || slug || "—";
  }

  function _renderCard(ticket) {
    const card = document.createElement("div");
    card.className = "ticket-card";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");

    card.innerHTML = `
      <div class="ticket-card-header">
        <span class="ticket-id">${_escapeHtml(ticket.ticket_ref)}</span>
        <span class="ticket-status ${STATUS_CSS[ticket.status] || "status-aberto"}">
          ${STATUS_LABELS[ticket.status] || ticket.status}
        </span>
      </div>
      <div class="ticket-subject">${_escapeHtml(ticket.subject)}</div>
      <div class="ticket-meta">
        <span class="ticket-category">${_escapeHtml(_categoryLabel(ticket.category))}</span>
        <span class="ticket-date">${_formatDate(ticket.created_at)}</span>
      </div>
    `;

    const open = () => TicketModal.open(ticket.id);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") open(); });
    return card;
  }

  function load() {
    const list   = document.getElementById("tickets-list");
    const empty  = document.getElementById("tickets-empty");
    if (!list) return;

    const { tickets } = TicketStorage.list({
      status: _currentStatus,
      search: _currentSearch,
    });

    list.innerHTML = "";

    if (tickets.length === 0) {
      if (empty) empty.style.display = "block";
    } else {
      if (empty) empty.style.display = "none";
      tickets.forEach((t) => list.appendChild(_renderCard(t)));
    }
  }

  let _searchDebounce = null;
  function _onSearch() {
    clearTimeout(_searchDebounce);
    _searchDebounce = setTimeout(() => {
      _currentSearch = document.getElementById("tickets-search")?.value.trim() || "";
      load();
    }, 300);
  }

  function init() {
    if (_initialized) return;
    _initialized = true;
    document.getElementById("tickets-search")?.addEventListener("input", _onSearch);
    document.getElementById("tickets-filter")?.addEventListener("change", (e) => {
      _currentStatus = e.target.value;
      load();
    });
  }

  return { init, load };
})();

/* ─────────────────────────────────────────────────────────
   TICKET MODAL
   ───────────────────────────────────────────────────────── */

const TicketModal = (() => {
  let _currentId = null;

  function _overlay() { return document.getElementById("ticket-modal-overlay"); }

  function _esc(str) {
    const d = document.createElement("div");
    d.appendChild(document.createTextNode(str || ""));
    return d.innerHTML;
  }

  function _fmt(iso) {
    try {
      return new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return iso || ""; }
  }

  function _categoryLabel(slug) {
    return CONFIG.CATEGORIES.find((c) => c.slug === slug)?.label || slug || "—";
  }

  function _render(ticket) {
    const SL = { "aberto": "Aberto", "em-andamento": "Em andamento", "resolvido": "Resolvido", "fechado": "Fechado" };
    const SC = { "aberto": "status-aberto", "em-andamento": "status-em-andamento", "resolvido": "status-resolvido", "fechado": "status-fechado" };

    const msgs = (ticket.messages || []).map((m) => `
      <div class="ticket-msg ${m.author === "user" ? "user" : "support"}">
        <div class="ticket-msg-author">${_esc(m.author_name || m.author)}</div>
        <div class="ticket-msg-text">${_esc(m.text)}</div>
        <div class="ticket-msg-time">${_fmt(m.created_at)}</div>
      </div>
    `).join("");

    const canReply = !["resolvido", "fechado"].includes(ticket.status);

    return `
      <div class="win-window ticket-modal">
        <div class="win-titlebar">
          <span>📋 ${_esc(ticket.ticket_ref)}</span>
          <div class="win-controls">
            <div class="win-btn" id="modal-close-btn">✕</div>
          </div>
        </div>
        <div class="ticket-modal-body">
          <div class="ticket-detail-row">
            <span class="ticket-detail-label">ASSUNTO</span>
            <span class="ticket-detail-value">${_esc(ticket.subject)}</span>
          </div>
          <div class="ticket-detail-row">
            <span class="ticket-detail-label">CATEGORIA</span>
            <span class="ticket-detail-value">${_esc(_categoryLabel(ticket.category))}</span>
          </div>
          <div class="ticket-detail-row">
            <span class="ticket-detail-label">STATUS</span>
            <span class="ticket-detail-value">
              <span class="ticket-status ${SC[ticket.status] || "status-aberto"}">
                ${SL[ticket.status] || ticket.status}
              </span>
            </span>
          </div>
          <div class="ticket-detail-row">
            <span class="ticket-detail-label">ABERTO EM</span>
            <span class="ticket-detail-value">${_fmt(ticket.created_at)}</span>
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
            Este ticket está ${(SL[ticket.status] || ticket.status).toLowerCase()} e não aceita novas respostas.
          </p>
          `}
        </div>
      </div>
    `;
  }

  function open(id) {
    _currentId = id;
    const overlay = _overlay();
    if (!overlay) return;

    try {
      const ticket = TicketStorage.getById(id);
      overlay.innerHTML = _render(ticket);
      overlay.classList.add("visible");

      const msgs = overlay.querySelector("#modal-messages");
      if (msgs) msgs.scrollTop = msgs.scrollHeight;

      overlay.querySelector("#modal-close-btn")?.addEventListener("click",  close);
      overlay.querySelector("#modal-close-btn2")?.addEventListener("click", close);
      overlay.querySelector("#modal-reply-btn")?.addEventListener("click",  _handleReply);
      overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); }, { once: true });
    } catch (err) {
      showToast("❌ " + err.message, "error");
    }
  }

  function _handleReply() {
    const input = document.getElementById("modal-reply-input");
    if (!input) return;
    const text = input.value.trim();
    if (!text) { showToast("⚠️ Digite uma mensagem.", "info"); return; }
    if (text.length > CONFIG.MAX_MSG_LENGTH) {
      showToast(`⚠️ Máximo de ${CONFIG.MAX_MSG_LENGTH} caracteres.`, "info");
      return;
    }

    const btn = document.getElementById("modal-reply-btn");
    if (btn) { btn.disabled = true; btn.textContent = "ENVIANDO..."; }

    setTimeout(() => {
      try {
        TicketStorage.addMessage(_currentId, text);
        showToast("✅ Resposta enviada!", "success");
        TicketList.load();
        open(_currentId); /* reabre para mostrar a nova mensagem */
      } catch (err) {
        showToast("❌ " + err.message, "error");
        if (btn) { btn.disabled = false; btn.textContent = "RESPONDER"; }
      }
    }, 400);
  }

  function close() {
    const overlay = _overlay();
    if (overlay) overlay.classList.remove("visible");
    _currentId = null;
  }

  return { open, close };
})();

/* ─────────────────────────────────────────────────────────
   ABAS
   ───────────────────────────────────────────────────────── */

function switchTab(tabId) {
  document.querySelectorAll(".suporte-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.tab === tabId);
  });
  document.querySelectorAll(".tab-panel").forEach((p) => {
    p.classList.toggle("active", p.id === tabId);
  });
  if (tabId === "tab-tickets") TicketList.load();
}

/* ─────────────────────────────────────────────────────────
   ESC
   ───────────────────────────────────────────────────────── */

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const overlay = document.getElementById("ticket-modal-overlay");
  if (overlay?.classList.contains("visible")) { TicketModal.close(); return; }
  const panel = document.getElementById("subPanel");
  if (panel?.classList.contains("open")) panel.classList.remove("open");
});

/* ─────────────────────────────────────────────────────────
   INIT
   ───────────────────────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", () => {
  TicketForm.init();
  TicketList.init();
  document.querySelectorAll(".suporte-tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });
});

window.goTo        = goTo;
window.showToast   = showToast;
window.toggleFaq   = toggleFaq;
window.switchTab   = switchTab;
window.TicketModal = TicketModal;
