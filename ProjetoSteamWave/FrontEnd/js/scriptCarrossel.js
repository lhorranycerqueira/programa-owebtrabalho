document.addEventListener("DOMContentLoaded", () => {
    // ===== STARS GENERATOR =====
  function generateStars(containerId, count = 80) {
    const c = document.getElementById(containerId);
    if (!c) return;
    for (let i = 0; i < count; i++) {
      const s = document.createElement("div");
      s.className = "star";
      const size = Math.random() * 2.5 + 0.5;
      s.style.cssText = `
  width:${size}px; height:${size}px;
  left:${Math.random() * 100}%;
  top:${Math.random() * 70}%;
  --dur:${Math.random() * 4 + 2}s;
  --delay:${Math.random() * 3}s;
  opacity:${Math.random() * 0.7 + 0.2};
    `;
      c.appendChild(s);
    }
  }
  generateStars("loginStars", 100);
  generateStars("homeStars", 100);
  generateStars("homenavStars", 80);

  // ===== MOVIMENTAÇÂO CARROSSEL =====
  const cards = document.querySelectorAll(".nav-card");
  /*cria um array com todos os elementos q tem a classe .nav-card*/

  let current = 2;

  /*função responsavel por trocar as classes e simular a rotação do carrossel*/
  function updateCarousel(){
  
  /*faz um loop foreach que le um array inteiro*/
  cards.forEach(card => {

    /*acessa a lista de classes e remove as seguintes classes*/
    card.classList.remove(
        "center-card",
        "left-card",
        "right-card",
        "far-left",
        "far-right"
    );

  });

  /*pega o total de cards e faz uma regra matematica pra redeterminar a posição dos cards após a mudança*/
  const total = cards.length;

    cards[current]
      .classList.add("center-card");

    cards[(current - 1 + total) % total]
      .classList.add("left-card");

    cards[(current + 1) % total]
      .classList.add("right-card");

    cards[(current - 2 + total) % total]
      .classList.add("far-left");

    cards[(current + 2) % total]
      .classList.add("far-right");
  }

  /* puxa a função que foi criada*/
  updateCarousel();

  /*functions de ir e voltar a pag*/
  function nextCard(){

    current++;

    current =
        (current + cards.length)
        % cards.length;

    updateCarousel();
  }

  function previousCard(){

    current--;

    current =
        (current + cards.length)
        % cards.length;

    updateCarousel();
  }

  /* Scroll do mouse */
  window.addEventListener("wheel",(e)=>{

    if(e.deltaY > 0){

        nextCard();

    }else{

        previousCard();

    }
  });

  /*botões*/
  const btnRigth = document.getElementById("go-rigth");
  const btnLeft = document.getElementById("go-left");

  btnRigth.addEventListener("click", nextCard);
  btnLeft.addEventListener("click", previousCard);

});

