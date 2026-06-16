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

const btnCadastrar = document.getElementById("btn-cadastrar");

if (btnCadastrar) {
    btnCadastrar.onclick = async () => {
        const user = document.getElementById("reg-user").value;
        const password = document.getElementById("reg-pass").value;
        const CaracterEspecial = /[^a-zA-Z0-9]/;

        if (
            !user.endsWith("@gmail.com") ||
            password.length < 8 ||
            !CaracterEspecial.test(password)
        ) {
            showToast(
                "O email deve ser @gmail.com, a senha deve ter 8+ caracteres e pelo menos um caractere especial!"
            );
            return;
        }

        const dados = {
            email: user.trim(),
            password: password,
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
                showToast("Sucesso: " + resultado.message);
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1500);
            } else {
                showToast("Erro: " + resultado.message);
            }
        } catch (error) {
            console.error("[Cadastro] Erro na requisição:", error);
            showToast(
                "Não foi possível falar com o servidor. Verifique se o Go está rodando!"
            );
        }
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
