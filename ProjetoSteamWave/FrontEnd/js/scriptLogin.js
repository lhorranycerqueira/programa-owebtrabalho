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

// Gerar estrelas dinamicamente no fundo
function createStar() {
    const container = document.getElementById("loginStars");
    let starCount = 100;

    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';

        const x = Math.random() * 100;
        const y = Math.random() * 37;
        const size = Math.random() * 3;
        const duration = 2 + Math.random() * 3;
        const delay = -(Math.random() * 5);

        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.setProperty('--dur', `${duration}s`);
        star.style.setProperty('--delay', `${delay}s`);

        container.appendChild(star);
    }
}

function doLogin() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPass").value;

    if (!email || !password) {
        showToast("Preencha todos os campos!");
        return;
    }

    abrirCaptchaModal();
}

async function enviarLogin() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPass").value;
    const captchaAnswer = document.getElementById("captchaAnswer").value;

    if (!captchaAnswer) {
        showToast("Digite os números do captcha!");
        return;
    }

    const dados = {
        email: email.trim(),
        password: password,
        captchaId: captchaIdAtual,
        captchaAnswer: captchaAnswer,
    };

    try {
        const response = await fetch("http://localhost:8080/Login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        if (response.status == 200) {
            const resultado = await response.json();
            localStorage.setItem("steamUserEmail", resultado.email);

            if (resultado.token) {
                localStorage.setItem("steamWaveToken", resultado.token);
            }

            fecharCaptchaModal();
            showToast("Login realizado");
            setTimeout(() => {
                window.location.href = "homepage.html";
            }, 1500);

        } else {
            const erro = await response.json();
            showToast(erro.message);
            carregarCaptcha();
        }
    } catch (error) {
        showToast("Erro com o servidor");
        console.error("Erro", error);
    }
}

function showToast(messagem) {
    const toast = document.getElementById("toast");
    toast.innerText = messagem;
    toast.classList.add("show");

    setTimeout(() => {
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

window.onload = createStar;
