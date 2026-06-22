document.addEventListener("DOMContentLoaded", () => {
  let topZ = 100;
  let dock = document.querySelector(".win-dock");
  
  if (!dock) {
    dock = document.createElement("div");
    dock.className = "win-dock";
    document.body.appendChild(dock);
  }

  document.querySelectorAll(".win-window").forEach((win, i) => {
    // Posição inicial em cascata se não definida no CSS
    if (!win.style.left) {
      win.style.left = 40 + i * 30 + "px";
      win.style.top = 40 + i * 30 + "px";
    }
    win.style.zIndex = topZ;

    const titlebar = win.querySelector(".win-titlebar");
    const closeBtn = win.querySelector(".win-close");
    const minBtn = win.querySelector(".win-minimize");
    const titleText = titlebar.querySelector("span")?.textContent || "Janela";

    // Trazer para a frente ao clicar em qualquer lugar da janela
    win.addEventListener("mousedown", () => {
      topZ++;
      win.style.zIndex = topZ;
    });

    // Sistema de arrastar corrigido
    let dragging = false, offsetX = 0, offsetY = 0;

    titlebar.addEventListener("mousedown", (e) => {
      if (e.target.classList.contains("win-btn")) return; // Não arrasta se clicar nos botões
      dragging = true;
      
      // Pega a posição do clique relativa às bordas da janela
      const rect = win.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
    });

    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      // Define a nova posição com base no ponteiro do mouse
      win.style.left = e.clientX - offsetX + "px";
      win.style.top = e.clientY - offsetY + "px";
    });

    document.addEventListener("mouseup", () => {
      dragging = false;
    });

    // Minimizar usando o botão de fechar ou o de minimizar (Baseado na sua lógica de Dock)
    if (closeBtn) {
      closeBtn.onclick = () => {
        win.style.display = "none";
        
        const dockItem = document.createElement("div");
        dockItem.className = "win-dock-item";
        dockItem.textContent = titleText;
        
        dockItem.onclick = () => {
          win.style.display = "flex"; // Voltando como flex para manter o layout interno
          topZ++;
          win.style.zIndex = topZ;
          dockItem.remove();
        };
        
        dock.appendChild(dockItem);
      };
    }
    
    // Vinculando a mesma ação ao botão de minimizar se ele existir
    if (minBtn && closeBtn) {
      minBtn.onclick = () => closeBtn.click();
    }
  });
});