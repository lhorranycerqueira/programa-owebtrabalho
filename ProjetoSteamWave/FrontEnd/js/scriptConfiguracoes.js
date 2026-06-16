function mudarTema() {
  //Pegamos o valor de onde ta as cores
  const seletor = document.getElementById("theme-selector");
  const chosenTheme = seletor.value;

  const varColor = document.documentElement;

  //Aqui quando o usuario escolher a cor que ele que
  if (chosenTheme === "terminal-green") {
    varColor.style.setProperty("--neon-pink", "#39ff14");
    varColor.style.setProperty("--neon-cyan", "#39ff14");
    varColor.style.setProperty("--neon-purple", "#006400");
  } else if (chosenTheme === "steam-original") {
    varColor.style.setProperty("--neon-pink", "#66c0f4");
    varColor.style.setProperty("--neon-cyan", "#66c0f4");
    varColor.style.setProperty("--neon-purple", "#1b2838");
  } else {
    varColor.style.setProperty("--neon-pink", "#ff00ff");
    varColor.style.setProperty("--neon-cyan", "#00eaff");
    varColor.style.setProperty("--neon-purple", "#9b30ff");
  }

  //Salvamos no localStorage para o navegador se elmbra dessa alteração
  localStorage.setItem("temaSteam", chosenTheme);
}

//Adicionei um toast para avisar, fica mais bonito
function showToast(mensagem) {
    const toast = document.getElementById("toast");
    if (!toast) {
        console.error("Elemento toast não encontrado!");
        return;
    }
    toast.innerText = mensagem;
    toast.classList.add("show");
    
    // Limpar timeout anterior se existir
    if (window.toastTimeout) {
        clearTimeout(window.toastTimeout);
    }
    
    window.toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

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
        password: password,
        theme: document.getElementById("theme-selector").value,
    };

    localStorage.setItem("steamConfig", JSON.stringify(configData));

    //Se o usuário digitou uma nova senha, enviamos para o backend atualizar no MongoDB
    if (password !== "") {
        if (currentPassword === "") {
            showToast("Digite sua senha atual para confirmar a alteração!");
            return;
        }

        const email = localStorage.getItem("steamUserEmail");

        if (!email) {
            showToast("Sessão expirada. Faça login novamente!");
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/UpdatePassword", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
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
            console.error("[Configuracoes] Erro na requisição:", error);
            showToast("Não foi possível falar com o servidor. Verifique se o Go está rodando!");
            return;
        }
    } else {
        showToast("Configurações salvas com sucesso!");
    }
}

document.addEventListener("DOMContentLoaded", function () {
  const savedData = JSON.parse(localStorage.getItem("steamConfig"));
  const savedTheme = localStorage.getItem("temaSteam");

  if (savedData) {
    document.getElementById("profile-status").value = savedData.profileStatus || "public";
    document.getElementById("online-status").checked = !!savedData.onlineStatus;
    document.getElementById("current-password").value = "";
    document.getElementById("id-password").value = "";
    document.getElementById("theme-selector").value = savedData.theme || "vaporwave";
  }

  // Reaplica o tema caso já tenha um salvo
  if (savedTheme) {
    document.getElementById("theme-selector").value = savedTheme;
    mudarTema();
  }

  const btnSave = document.querySelector(".btn-alteracoes");
  if (btnSave) {
    btnSave.addEventListener("click", salvarConfiguracoes);
  }
});
