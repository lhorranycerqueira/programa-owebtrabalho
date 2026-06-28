// ======================================
// STEAMWAVE THEME CONTROLLER
// ======================================

const body = document.body;

// ======================================
// Limpar temas alternativos
// ======================================

function clearThemes() {
    body.classList.remove("light-mode", "low-sensitivity");
}

// ======================================
// Aplicar tema na interface
// ======================================

function applyTheme(theme) {
    clearThemes();

    // Atualiza o select da página de configurações (se existir)
    const selector = document.getElementById("theme-selector");
    if (selector) {
        selector.value = theme;
    }

    // Dark é o padrão, não adiciona classe
    if (theme === "light") {
        body.classList.add("light-mode");
    }

    if (theme === "sensitive") {
        body.classList.add("low-sensitivity");
    }

    // Salva localmente para aplicar rápido nas próximas páginas
    localStorage.setItem("temaSteam", theme);
}

// ======================================
// Buscar tema salvo no backend
// ======================================

async function loadUserTheme() {
    const temaLocal = localStorage.getItem("temaSteam");
    if (temaLocal) {
        applyTheme(temaLocal);
    }
}

// ======================================
// Alterar tema pelo SELECT
// ======================================

async function changeTheme(theme) {
    applyTheme(theme);

    const email = localStorage.getItem("steamUserEmail");
    if (!email) return;

    try {
        await fetch("http://localhost:8080/UpdateTheme", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: email,
                theme: theme,
            }),
        });
    } catch (error) {
        console.log("Erro ao salvar tema:", error);
    }
}

// ======================================
// Carregar automaticamente em todas as páginas
// ======================================

window.addEventListener("DOMContentLoaded", () => {
    loadUserTheme();
});