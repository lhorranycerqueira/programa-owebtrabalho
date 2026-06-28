let _accessToken = null;

const Auth = {
    setAccessToken(token) { _accessToken = token; },
    getAccessToken()      { return _accessToken; },
    clearAccessToken()    { _accessToken = null; },

    // Mostra um toast na tela antes de redirecionar
    // Funciona em qualquer página que tenha um elemento #toast
    mostrarToastERedirecionarParaLogin(mensagem = "Sessão expirada. Faça login novamente!") {
        const toast = document.getElementById("toast");
        if (toast) {
            toast.innerText = mensagem;
            toast.classList.add("show");
            setTimeout(() => {
                window.location.href = "login.html";
            }, 3000); // Espera 3 segundos para o usuário ler
        } else {
            // Se não tem toast na página, redireciona direto
            window.location.href = "login.html";
        }
    },

    isAccessTokenValido() {
        if (!_accessToken) return false;
        try {
            const payload = JSON.parse(atob(_accessToken.split(".")[1]));
            return Date.now() < (payload.exp - 30) * 1000;
        } catch {
            return false;
        }
    },

    async renovarToken() {
        try {
            const response = await fetch("http://localhost:8080/Refresh", {
                method: "POST",
                credentials: "include", // Envia o cookie refresh_token automaticamente
            });
            if (!response.ok) return false;
            const data = await response.json();
            this.setAccessToken(data.accessToken);
            return true;
        } catch {
            return false;
        }
    },

    async getTokenValido() {
        if (this.isAccessTokenValido()) return _accessToken;
        // Access token expirou ou não existe - tenta renovar com o cookie
        const renovado = await this.renovarToken();
        return renovado ? _accessToken : null;
    },

    async fetchAutenticado(url, opcoes = {}) {
        const token = await this.getTokenValido();
        if (!token) {
            this.mostrarToastERedirecionarParaLogin();
            return null;
        }
        return fetch(url, {
            ...opcoes,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                ...(opcoes.headers || {}),
            },
            credentials: "include",
        });
    },

    async logout() {
        this.clearAccessToken();
        localStorage.removeItem("steamUserEmail");
        try {
            await fetch("http://localhost:8080/Logout", {
                method: "POST",
                credentials: "include",
            });
        } catch {
            // Mesmo se falhar, o usuário é deslogado localmente
        }
        window.location.href = "login.html";
    },


    async verificarAutenticacao() {
        const token = await this.getTokenValido();
        if (!token) {
            this.mostrarToastERedirecionarParaLogin();
            return false;
        }
        return true;
    },
};
