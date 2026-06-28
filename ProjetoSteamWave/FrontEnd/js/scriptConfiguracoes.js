document.addEventListener("DOMContentLoaded", async function () {
    const savedData = JSON.parse(localStorage.getItem("steamConfig"));
    const savedTheme = localStorage.getItem("temaSteam");

    if (savedData) {
        document.getElementById("profile-status").value = savedData.profileStatus || "public";
        document.getElementById("online-status").checked = !!savedData.onlineStatus;
        document.getElementById("current-password").value = "";
        document.getElementById("id-password").value = "";
        document.getElementById("theme-selector").value = savedData.theme || "dark";
    }

    if (savedTheme) {
        document.getElementById("theme-selector").value = savedTheme;
        changeTheme(savedTheme);
    }

    const btnSave = document.querySelector(".btn-alteracoes");
    if (btnSave) {
        btnSave.addEventListener("click", salvarConfiguracoes);
    }

    const btnCancel = document.getElementById("btn-cancelar");
    if (btnCancel) {
        btnCancel.addEventListener("click", function () {
            if (document.referrer && document.referrer.includes(window.location.origin)) {
                window.history.back();
            } else {
                window.location.href = "carrossel.html";
            }
        });
    }
});

async function salvarConfiguracoes() {
    const currentPasswordInput = document.getElementById("current-password");
    const passwordInput = document.getElementById("id-password");
    const currentPassword = currentPasswordInput.value;
    const password = passwordInput.value;

    const rulePassword = /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;

    if (password !== "" && !rulePassword.test(password)) {
        showToast("Senha deve ter 8+ caracteres, 1 maiúscula e 1 caractere especial!");
        return;
    }

    const configData = {
        profileStatus: document.getElementById("profile-status").value,
        onlineStatus: document.getElementById("online-status").checked,
        theme: document.getElementById("theme-selector").value,
    };
    localStorage.setItem("steamConfig", JSON.stringify(configData));

    const email = localStorage.getItem("steamUserEmail");

    if (email) {
        try {
            await fetch("http://localhost:8080/UpdateTheme", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email,
                    theme: configData.theme,
                }),
            });
        } catch (error) {
            console.error("Erro ao salvar tema:", error);
        }
    }

    if (password !== "") {
        if (currentPassword === "") {
            showToast("Digite sua senha atual para confirmar a alteração!");
            return;
        }

        if (!email) {
            showToast("Sessão expirada. Faça login novamente!");
            setTimeout(() => { window.location.href = "login.html"; }, 1500);
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/UpdatePassword", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email,
                    currentPassword: currentPassword,
                    newPassword: password,
                }),
            });

            const resultado = await response.json();

            if (response.status === 200) {
                showToast("Senha alterada com sucesso!");
                passwordInput.value = "";
                currentPasswordInput.value = "";
            } else {
                showToast("Erro: " + resultado.message);
            }
        } catch (error) {
            console.error("Configuracoes Erro na requisição:", error);
            showToast("Não foi possível falar com o servidor. Verifique se o Go está rodando!");
        }
    } else {
        showToast("Configurações salvas com sucesso!");
    }
}

function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        button.textContent = "👁‍🗨";
    } else {
        input.type = "password";
        button.textContent = "👁";
    }
}

function showToast(mensagem) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.innerText = mensagem;
    toast.classList.add("show");

    if (window.toastTimeout) clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

document.addEventListener("mouseup", function (e) {
    if (e.button === 3) {
        e.preventDefault();
        window.history.back();
    }
});

window.addEventListener("popstate", function () {
    if (document.referrer && document.referrer.includes(window.location.origin)) {
        window.history.back();
    } else {
        window.location.href = "carrossel.html";
    }
});
