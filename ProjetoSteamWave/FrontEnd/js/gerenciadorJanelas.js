


// espera o HTML inteiro carregar antes de rodar o script,
document.addEventListener("DOMContentLoaded", () => {

  // controla qual janela fica "por cima" das outras
  // cada vez que o usuario clica numa janela, ela ganha um z index maior que todas as outras simulando o comportamento real do windows
  let topZ = 100;

  // procura se já existe um dock na página e se nao existir cria um novo div win dock e adiciona no final do body
  // util pra nao precisar por essa div manualmente em cada htmlL.
  let dock = document.querySelector(".win-dock");
  
  if (!dock) {
    dock = document.createElement("div");
    dock.className = "win-dock";
    document.body.appendChild(dock);
  }


  // passa por todas as janelas pra configurar o comportamento
  document.querySelectorAll(".win-window").forEach((win, i) => {



    // se a janela nao tem um left definido no estilo inline, ela vai definir uma posicao inicialem  cascata, a janela 0 fica em 
    //20,20 e a janela 1 em 50,50.. isso evita q todas nascam exatamente empilhadas umas sobre as outras
    // é a posicao inicial
    if (!win.style.left) {
      win.style.left = 40 + i * 30 + "px";
      win.style.top = 40 + i * 30 + "px";
    }
    // define a ordem de empilhamento inicial
    win.style.zIndex = topZ;

    // pega as referencias do elementos internos que vai ser usado, a barra de titulo e o botao de fechar e o texto
    const titlebar = win.querySelector(".win-titlebar");
    const closeBtn = win.querySelector(".win-btn:last-child");
    const titleText = titlebar.querySelector("span")?.textContent || "Janela"; // o ? vai evitar erro caso nao tenha span e vai usar janela como titulo padrao



    // se usuario clica em qualquer lugar da janela, ela sobe no z index e vai ficar visualmente acima das outras
    win.addEventListener("mousedown", () => {
      topZ++;
      win.style.zIndex = topZ;
    });


    // dragging controla se o mouse esta arrastando a janela especifica
    let dragging = false;


    // offsetx e offsety guardam a distancia entre o ponto onde o usuario clicou e o canto superior esquerdo da janela
    // se tirar isso, a janela pularia pra colar no cursor toda vez q se move o mouse, ao inves de manter a posicao relativa 
    let offsetX = 0, offsetY = 0;

    // pra quando o botao for pressionado na barra de titulo
    titlebar.addEventListener("mousedown", (e) => {
      // se o clique foi em um dos botoes nao inicia
      if (e.target.classList.contains("win-btn")) return;

      dragging = true;
      
      // Pega a posição do clique relativa às bordas da janela
      const rect = win.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
    });

  // fica no document porque o mouse pode mover rapido e escapar da area da titlebar, ouvindo no document o arrasto funciona melhor
    document.addEventListener("mousemove", (e) => {
      if (!dragging) return; // so faz algo se estiver arrastando essa janela
      // calculado no mousedown pra manter o ponto de pegada
      win.style.left = e.clientX - offsetX + "px";
      win.style.top = e.clientY - offsetY + "px";
    });

    // ao soltar o botao ele para de arrastar
    document.addEventListener("mouseup", () => (dragging = false));

    // pra fechar mas sem deixar a tela no vazio existencial
    if (closeBtn) {
      // sobrescreve o comportamento antigo 
      closeBtn.onclick = () => {
        // esconde a janela visualmente
        win.style.display = "none";

        // mas cria um botao no dock pra poder reabrir a janela dps
        const dockItem = document.createElement("div");
        dockItem.className = "win-dock-item";
        dockItem.textContent = titleText;

        
        dockItem.onclick = () => {
          win.style.display = "block"; // janela volta a aparecer
          topZ++;
          win.style.zIndex = topZ;     // vem pra frente de tudo
          dockItem.remove();           // remove o proprio botao do dock
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