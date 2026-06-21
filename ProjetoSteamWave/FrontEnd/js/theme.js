// ======================================
// STEAMWAVE THEME CONTROLLER
// Backend version
// ======================================


const body = document.body;



// limpa temas anteriores

function clearThemes(){


    body.classList.remove(

        "light-mode",

        "low-sensitivity"

    );

}





// aplica tema recebido

function applyTheme(theme){


    clearThemes();



    if(theme === "light"){


        body.classList.add(
            "light-mode"
        );


    }



    if(theme === "sensitive"){


        body.classList.add(
            "low-sensitivity"
        );


    }



    // dark é o padrão
    // então não precisa adicionar classe

}





// ======================================
// Buscar usuário logado
// ======================================


async function loadUserTheme(){


    const token =
    localStorage.getItem("token");



    if(!token){

        return;

    }



    try{


        const response =
        await fetch(
            "http://localhost:8080/me",
            {


            method:"GET",


            headers:{


                "Authorization":
                "Bearer " + token


            }


        });



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
            "Erro ao buscar tema:",
            error
        );

    }



}





// ======================================
// Alterar tema
// ======================================


async function changeTheme(theme){



    const token =
    localStorage.getItem("token");



    if(!token){

        return;

    }




    try{


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


        });



        // aplica imediatamente
        applyTheme(theme);



    }


    catch(error){


        console.log(
            "Erro ao salvar tema:",
            error
        );


    }



}





// ======================================
// Carregar ao abrir qualquer página
// ======================================


window.addEventListener(

"DOMContentLoaded",

()=>{


    loadUserTheme();


}

);
