class SteamWindow {

    // Guarda o maior z-index utilizado
    static highestZ = 10;

    constructor(element){

        // Janela atual
        this.window = element;

        // Barra superior
        this.header = element.querySelector(".sw-window-header");

        // Variáveis do sistema de arraste
        this.dragging = false;
        this.offsetX = 0;
        this.offsetY = 0;

        // Inicializa tudo
        this.init();

    }

    init(){

        this.registerEvents();

    }

    registerEvents(){

        // Quando clicar em qualquer parte da janela,
        // ela vem para frente.
        this.window.addEventListener("mousedown",()=>{

            this.focusWindow();

        });

        // Quando clicar na barra superior,
        // começaremos o arraste.
        this.header.addEventListener("mousedown",(event)=>{

            this.startDrag(event);

        });

    }

    // ==========================================
    // Coloca a janela na frente das demais
    // ==========================================
    focusWindow(){

        document.querySelectorAll(".sw-window").forEach(window=>{

            window.classList.remove("window-active");

        });

        SteamWindow.highestZ++;

        this.window.style.zIndex = SteamWindow.highestZ;

        this.window.classList.add("window-active");

    }

    // ==========================================
    // Inicia o arraste da janela
    // ==========================================
    startDrag(event){

        console.log("Iniciando arraste...");

    }

}

document.addEventListener("DOMContentLoaded",()=>{

    const windows = document.querySelectorAll(".sw-window");

    windows.forEach(window=>{

        new SteamWindow(window);

    });

    if(windows.length){

        windows[0].dispatchEvent(new MouseEvent("mousedown"));

    }

});