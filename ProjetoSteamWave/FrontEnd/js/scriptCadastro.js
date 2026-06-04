//Vamos pegar o botão de cadastrar
const btnCadastrar = document.getElementById("btn-cadastrar");

if (btnCadastrar) {
    btnCadastrar.onclick = async () => {
        const user = document.getElementById("reg-user").value;
        const password = document.getElementById("reg-pass").value;
        const CaracterEspecial = /[^a-zA-Z0-9]/; //Regra para simbolos

        //Validação: Email @gmail, senha 8+ caracteres e ter caractere especial
        if (
            !user.endsWith("@gmail.com") ||
            password.length < 8 ||
            !CaracterEspecial.test(password)
        ) {
            alert(
                "O email deve ser @gmail.com, a senha deve ter 8+ caracteres e pelo menos um caractere especial!",
            );
            return;
        }

        const dados = {
            email: user,
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
                alert("Sucesso: " + resultado.message);
                window.location.href = "login.html";
            } else {
                alert("Erro: " + resultado.message);
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
            alert(
                "Não foi possível falar com o servidor. Verifique se o Go está rodando!",
            );
        }
    };
    
    // Geração de estrelas
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
