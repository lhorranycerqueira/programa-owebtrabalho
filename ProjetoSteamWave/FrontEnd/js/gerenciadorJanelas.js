
document.addEventListener("DOMContentLoaded", () => {
  let topZ = 100;
  let dock = document.querySelector(".win-dock");
  if (!dock) {
    dock = document.createElement("div");
    dock.className = "win-dock";
    document.body.appendChild(dock);
  }

  document.querySelectorAll(".win-window").forEach((win, i) => {
    // posição inicial em cascata
    if (!win.style.left) {
      win.style.left = 20 + i * 30 + "px";
      win.style.top = 20 + i * 30 + "px";
    }
    win.style.zIndex = topZ;

    const titlebar = win.querySelector(".win-titlebar");
    const closeBtn = win.querySelector(".win-btn:last-child");
    const titleText = titlebar.querySelector("span")?.textContent || "Janela";

    // trazer pra frente ao clicar
    win.addEventListener("mousedown", () => {
      topZ++;
      win.style.zIndex = topZ;
    });

    // arrastar
    let dragging = false, offsetX = 0, offsetY = 0;
    titlebar.addEventListener("mousedown", (e) => {
      if (e.target.classList.contains("win-btn")) return; // nao arrasta clicando nos botões
      dragging = true;
      offsetX = e.clientX - win.offsetLeft;
      offsetY = e.clientY - win.offsetTop;
    });
    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      win.style.left = e.clientX - offsetX + "px";
      win.style.top = e.clientY - offsetY + "px";
    });
    document.addEventListener("mouseup", () => (dragging = false));

    // minimizar ao inves de fechar
    if (closeBtn) {
      closeBtn.onclick = () => {
        win.style.display = "none";
        const dockItem = document.createElement("div");
        dockItem.className = "win-dock-item";
        dockItem.textContent = titleText;
        dockItem.onclick = () => {
          win.style.display = "block";
          topZ++;
          win.style.zIndex = topZ;
          dockItem.remove();
        };
        dock.appendChild(dockItem);
      };
    }
  });
});