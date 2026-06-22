//Para habilitar o click do menu hamburguer
function toggleSidebar() {
  const sidebar = document.getElementById("brawlSidebar");
  sidebar.classList.toggle("open");
}

document.addEventListener("DOMContentLoaded", () => {
  // Chamar a função para buscar os dados do banco assim que a página carregar
  carregarDadosDoPerfil();
});

function carregarDadosDoPerfil() {
  // No futuro, a rota do backend em Go será algo como "/api/me" ou "/api/perfil"
  const URL_BACKEND = "http://localhost:8080/api/perfil"; 

  // Exemplo de como o Go vai devolver os dados (JSON) para o FrontEnd:
  // {
  //   "display_name": "! Megane ツ",
  //   "username": "hikamber_megane",
  //   "status": "ONLINE",
  //   "bio": "-- https://guns.lol/megane -- \n🎵 Falso anjo - Oshaman",
  //   "avatar": "../../assent/avatarGenerico.png"
  // }

  fetch(URL_BACKEND)
    .then(response => {
      if (!response.ok) {
        throw new Error("Usuário não logado ou erro no banco.");
      }
      return response.json();
    })
    .then(data => {
      // Aqui o JS pega os IDs do HTML e injeta os dados REAIS do Banco de Dados:
      document.getElementById("user-display-name").textContent = data.display_name;
      document.getElementById("user-username").textContent = "@" + data.username;
      document.getElementById("user-status").textContent = data.status;
      document.getElementById("user-bio").innerHTML = data.bio.replace(/\n/g, '<br>');
      
      if(data.avatar) {
        document.getElementById("user-avatar").src = data.avatar;
      }
    })
    .catch(error => {
      console.error("Erro ao puxar dados do Go:", error);
      // Dados padrão/Mock caso o backend não esteja rodando ainda (para testes)
      mostrarDadosMock();
    });
}

// Função auxiliar para vocês conseguirem ver o layout funcionando mesmo sem o Go rodar junto
function mostrarDadosMock() {
  document.getElementById("user-display-name").textContent = "! Megane ツ";
  document.getElementById("user-username").textContent = "@hikamber_megane";
  document.getElementById("user-status").textContent = "0NL1N3";
  document.getElementById("user-bio").innerHTML = `-- https://guns.lol/megane -- <br> 🎵 Falso anjo - Oshaman`;
}