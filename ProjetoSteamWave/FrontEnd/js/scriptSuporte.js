/* goTo()   navegação entre as páginas
showToast() notificação temporária
toggleFaq() perguntas frequentes
Atalho ESC  fecha sub-painéis abertos */


/* 
   remove a classe .active de todas as páginas e a adiciona somente na página alvo pelo seu id
tentando entender isso aq ainda(acho que entendi) pageId {string} — id do elemento <div class="page"> a exibir
                       Ex.: 'page-homenav', 'page-loja', 'page-perfil'
*/
function goTo(pageId) {
  // remove o estado ativo das paginas
  document
    .querySelectorAll(".page") 
    .forEach((p) => p.classList.remove("active"));

  const target = document.getElementById(pageId);
  if (target) target.classList.add("active");

  // remove o estado ativo dos botões de navegação global
  // (o CSS de .gnav-btn.active voltará a ser aplicado quando o botão correto for marcado manualmente)
  document
    .querySelectorAll(".gnav-btn")
    .forEach((b) => b.classList.remove("active"));
}


// o toast a mensagem tempoorariaaa

let toastTimer; // guarda a referência do timer pra nao dar sobreposicao

function showToast(msg) {
  const t = document.getElementById("toast"); // elemento do toast no html

  t.textContent = msg;           // define o texto da notificação
  t.classList.add("show");       // desliza o toast para dentro da tela com css

  // cancela o timer anterior caso o toast seja acionado antes de fechar
  clearTimeout(toastTimer);

  // agenda a remoção da classe .show após 3 segundos
  toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
}


/* faq pra mexer nas perguntas e respostas
se chama o elemento da pergunta e a resposta vem em seguida por conta da hierarquia do html !
*/
function toggleFaq(el) {
  // o elemento irmão imediatamente após .faq-q é o .faq-a
  const answer = el.nextElementSibling;

  // alterna a classe .open, que exibe ou oculta a resposta com css
  answer.classList.toggle("open");

  // atualiza o ícone de seta ▲ se aberto, ▼ se fechado
  // o último <span> dentro de .faq-q contém a seta
  el.querySelector("span:last-child").textContent =
    answer.classList.contains("open") ? "▲" : "▼";
}


/* o esc escape omaigod
  na tela de suporte, fecha o subpainel de configurações caso ele esteja aberto.
*/
document.addEventListener("keydown", (e) => { 
  if (e.key === "Escape") {
    const panel = document.getElementById("subPanel");

    // só age se o subpainel existir e estiver aberto
    if (panel && panel.classList.contains("open")) {
      panel.classList.remove("open"); // fecha o painel
    }
  }
});
