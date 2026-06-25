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
    // Aplica o tema local imediatamente para não piscar
    const temaLocal = localStorage.getItem("temaSteam");
    if (temaLocal) {
        applyTheme(temaLocal);
    }

    // Depois busca o tema atualizado do backend
    try {
        const response = await Auth.fetchAutenticado("http://localhost:8080/Me", {
            method: "GET",
        });

        if (!response || !response.ok) return;

        const user = await response.json();
        if (user.theme) {
            applyTheme(user.theme);
        }
    } catch (error) {
        console.log("Erro ao carregar tema:", error);
    }
}

// ======================================
// Alterar tema pelo SELECT
// ======================================

async function changeTheme(theme) {
    // Aplica imediatamente sem esperar o backend
    applyTheme(theme);

    const email = localStorage.getItem("steamUserEmail");
    if (!email) return;

    try {
        await Auth.fetchAutenticado("http://localhost:8080/UpdateTheme", {
            method: "POST",
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