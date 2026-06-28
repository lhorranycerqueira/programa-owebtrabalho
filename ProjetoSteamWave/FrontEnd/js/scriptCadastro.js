let captchaIdAtual = "";

async function carregarCaptcha() {
    try {
        const response = await fetch("http://localhost:8080/CaptchaNew");
        const data = await response.json();
        captchaIdAtual = data.captchaId;
        document.getElementById("captchaImg").src = data.captchaUrl;
        document.getElementById("captchaAnswer").value = "";
    } catch (error) {
        console.error("Erro ao carregar captcha:", error);
        showToast("Erro ao carregar captcha");
    }
}

function abrirCaptchaModal() {
    carregarCaptcha();
    document.getElementById("captchaModal").classList.add("active");
}

function fecharCaptchaModal() {
    document.getElementById("captchaModal").classList.remove("active");
}

function showToast(mensagem) {
    const toast = document.getElementById("toast");
    if (!toast) {
        console.error("Elemento toast não encontrado!");
        return;
    }
    toast.innerText = mensagem;
    toast.classList.add("show");

    if (window.toastTimeout) {
        clearTimeout(window.toastTimeout);
    }

    window.toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
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

const btnCadastrar = document.getElementById("btn-cadastrar");

if (btnCadastrar) {
    btnCadastrar.onclick = () => {
        const user = document.getElementById("reg-user").value;
        const password = document.getElementById("reg-pass").value;
        const CaracterEspecial = /[^a-zA-Z0-9]/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(user)) {
            showToast("Digite um email válido!");
            return;
        }

        if (password.length < 8 || !CaracterEspecial.test(password)) {
            showToast(
                "A senha deve ter 8+ caracteres e pelo menos um caractere especial!"
            );
            return;
        }

        abrirCaptchaModal();
    };

    const bg = document.getElementById("synth-bg");
    for (let i = 0; i < 120; i++) {
        const s = document.createElement("div");
        s.classList.add("star");
        if (Math.random() < 0.2) s.classList.add("cyan");
        const size = Math.random() * 2.5 + 0.5;
        s.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                --dur: ${(Math.random() * 3 + 1.5).toFixed(2)}s;
                --delay: ${(Math.random() * 4).toFixed(2)}s;
            `;
        bg.appendChild(s);
    }
}

async function enviarCadastro() {
    const user = document.getElementById("reg-user").value;
    const password = document.getElementById("reg-pass").value;
    const captchaAnswer = document.getElementById("captchaAnswer").value;

    if (!captchaAnswer) {
        showToast("Digite os números do captcha!");
        return;
    }

    const dados = {
        email: user.trim(),
        password: password,
        captchaId: captchaIdAtual,
        captchaAnswer: captchaAnswer,
    };

    try {
        const response = await fetch("http://localhost:8080/Users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dados),
        });

        const resultado = await response.json();

        if (response.status === 201) {
            fecharCaptchaModal();
            showToast("Sucesso: " + resultado.message);
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);
        } else {
            showToast("Erro: " + resultado.message);
            carregarCaptcha();
        }
    } catch (error) {
        console.error("Cadastro Erro na requisição:", error);
        showToast(
            "Não foi possível falar com o servidor. Verifique se o Go está rodando!"
        );
    }
}
