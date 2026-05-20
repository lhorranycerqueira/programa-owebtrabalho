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

//Função para salvar o estado dos campos(Privacidade, Senha)
function salvarConfiguracoes() {
    const passwordInput = document.getElementById("id-password");
    const password = passwordInput.value;

    const rulePassword = /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;

    if (password !== "" && !rulePassword.test(password)) {
        alert("A senha deve ter mais de 8 dígitos, pelo menos uma letra maiúscula e um caractere especial!");
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
        passwordInput.value = "";
    }
  alert("Configurações salvas com sucesso no sistema!");
}

document.addEventListener("DOMContentLoaded", function () {
  const savedData = JSON.parse(localStorage.getItem("steamConfig"));
  const savedTheme = localStorage.getItem("temaSteam");

  if (savedData) {
    document.getElementById("profile-status").value = savedData.profileStatus || "public";
    document.getElementById("online-status").checked = !!savedData.onlineStatus;
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
