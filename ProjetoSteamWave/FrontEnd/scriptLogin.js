// Gerar estrelas dinamicamente no fundo
function createStar() {
    const container = document.getElementById("loginStars");
    let starCount = 100;

    //O for vai deixar tudo em loop das estrelas no nosso html
    for (let i = 0; i < starCount; i++) {
        // Ele cria uma div no html para esse loop de estrelas
        const star = document.createElement('div');
        //Ele cria uma class para podemos usar os comando do CSS, como o style
        star.className = 'star';

        //Posição das estrelas
        // O Math.random(), gera um número decimal aleatório entre 0 e 1 .
        const x = Math.random() * 67; // Posição vertical
        const y = Math.random() * 42; // POsição Horizontal
        const size = Math.random(1) * 3; //Define o tamnho(Largura que eles vão ter, e a altura tbm)
        const duration = Math.random * 2;

        
        // Aplica a posição e o tamanho calculados à estrela usando CSS
        star.style.left = `${x}%`; //Tem que usar o acento grave para usar o $ ``
        star.style.top = `${y}%`;
        star.style.width = `${size}px`; //A largura
        star.style.height = `${size}px`;//A altura
        //O .style.setProperty deixa nos definir uma propriedade de estilo direto no codigo
        //O --dur so pode porque usamos o setProperty
        star.style.setProperty = (`--dur`, `${duration}s`); //Isso serve para ver o tempo 


        container.appendChild(star);
    }
}

function Login() {
    //Ele pega o que está digitado nos campos
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPass").value;

    //Verifica se todos os campos estão preenchidos
    if (!email || !password) {
        //Mostra uma menssagem de aviso
        showToast("Preencha todos os campos!");
        return;
    }

    showToast(`Bem vindo`);
}
//Esse menssagem dentro é o paramentro
//Ela serve para passarmos informaçoes para a func
function showToast(messagem) {
    const toast = document.getElementById("toast");
    //o innerText define o texto dele
    toast.innerText = messagem;
    //Ele adiciona mais uma class do toast, não usamos o className aqui pq?
    //O className substitui todas as classes do elemento, ele iria apagar todos
    toast.className.add("show");


    // Define um temporizador: após 3 segundos (3000ms), remove a classe 'show'
    // Isso faz com que o toast desapareça
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

//Ela serve para colocar na tela as nossas estrelas da func createStar.
//Ele so executa depois que tudo foi carregado
window.onload = createStar;