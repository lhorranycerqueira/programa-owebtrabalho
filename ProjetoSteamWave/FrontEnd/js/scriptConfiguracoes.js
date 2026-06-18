//Verifica o token
document.addEventListener("DOMContentLoaded", function() {
    const token = localStorage.getItem("steamWaveToken");
    const email = localStorage.getItem("steamUserEmail");
    
    if (!token || !email) {
        showToast("Faça login para acessar as configurações!");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
        return;
    }
});

function mudarTema() {
  const seletor = document.getElementById("theme-selector");
  const chosenTheme = seletor.value;
  const varColor = document.documentElement;

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
//Adicionei um toast para ficar mais bonito os avisos
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
    toast.classList.remove("show");
  }, 3000);
}

//Para o usuario conseguir trocar a senha dele e o JS mandar a requisição para o meu BackEnd
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

  if (savedTheme) {
    document.getElementById("theme-selector").value = savedTheme;
    mudarTema();
  }

  const btnSave = document.querySelector(".btn-alteracoes");
  if (btnSave) {
    btnSave.addEventListener("click", salvarConfiguracoes);
  }

  //Voltar para a página que estava antes, isso tava faltando
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
