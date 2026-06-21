// ======================================
// STEAMWAVE THEME CONTROLLER
// Backend + Config Select
// ======================================


const body = document.body;


// ======================================
// Limpar temas alternativos
// ======================================


function clearThemes() {

    body.classList.remove(
        "light-mode",
        "low-sensitivity"
    );

}





// ======================================
// Aplicar tema na interface
// ======================================


function applyTheme(theme) {


    clearThemes();



    // Atualiza o select da página
    // de configurações

    const selector =
    document.getElementById(
        "theme-selector"
    );


    if(selector){

        selector.value = theme;

    }





    // Dark é o padrão
    // então não adiciona classe


    if(theme === "light") {


        body.classList.add(
            "light-mode"
        );


    }



    if(theme === "sensitive") {


        body.classList.add(
            "low-sensitivity"
        );


    }


}






// ======================================
// Buscar tema salvo no usuário
// ======================================


async function loadUserTheme() {


    const token =
    localStorage.getItem(
        "token"
    );



    if(!token){

        return;

    }




    try {


        const response =
        await fetch(
            "http://localhost:8080/me",
            {

                method:"GET",


                headers:{


                    "Authorization":

                    "Bearer " + token


                }


            }

        );



        if(!response.ok){

            return;

        }



        const user =
        await response.json();



        applyTheme(
            user.theme
        );



    }


    catch(error){


        console.log(
            "Erro ao carregar tema:",
            error
        );


    }


}






// ======================================
// Alterar tema pelo SELECT
// ======================================


async function changeTheme(theme) {


    const token =
    localStorage.getItem(
        "token"
    );



    // Aplica imediatamente
    // sem esperar o backend

    applyTheme(theme);





    if(!token){

        return;

    }





    try {


        await fetch(
            "http://localhost:8080/theme",
            {


                method:"PUT",


                headers:{


                    "Authorization":

                    "Bearer " + token,


                    "Content-Type":

                    "application/json"


                },



                body:JSON.stringify({

                    theme: theme

                })


            }

        );



    }


    catch(error){


        console.log(
            "Erro ao salvar tema:",
            error
        );


    }


}







// ======================================
// Carregar automaticamente em todas páginas
// ======================================


window.addEventListener(

    "DOMContentLoaded",

    ()=>{


        loadUserTheme();


    }

);
