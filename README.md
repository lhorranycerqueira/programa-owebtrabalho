
## Tecnologias e Ferramentas
O que usamos no projeto:

- **Back-End:** Go (Golang) — Escolhido por sua eficiência na construção de APIs RESTful.
- **Front-End:** HTML e CSS usados para fazer os layouts modernos (CSS Grid/Flexbox) e JavaScript.
- **Estilo e Design:** Conceito estético *Vaporwave* com referências a interfaces desktop clássicas e animações.
- **Versionamento:** Git e GitHub para organização do código e integração entre a nossa equipe.

# Como rodar o projeto
###  Pré-requisitos
Ter instalado em sua máquina:
* [Go (Golang)](https://go.dev/dl/)
### Instalação de Dependências
Baixe todas as dependências automaticamente:
```bash
go mod download
```
### Configuração do Banco de Dados
No projeto estamos usando o MongoDB Atlas.
- Veja se seu arquivo `.env` está configurad com a sua Connection String:
```bash
MONGO_URI=mongodb+srv://<usuario>:<senha>@cluster0.lozapyk.mongodb.net/
```
### Inicie o BackEnd
Após subir o banco, inicie o servido:
```bash
go run .
``` 

## anotações do que cada um está fazendo! (atualizem conforme forem fazendo por favor)

## Atualizações Rickelmy 11/05
- **Arquitetura**: Separei os arquivos do projeto entre **Front-End** e **Back-End**.
- **Organização do Front-End**: Dividi a estrutura em pastas específicas para `js`, `css` e `pages`.
- **Organização do Back-End**: Fiz a pasta com os arquivos **Go** do Back-End.
- **Autenticação**: Desenvolvi as telas e a lógica de **Login** e **Cadastro**.
- **Back-End**: Fiz a API de cadastro utilizando **Go (Golang)**.

## atualização 16/05 math:
- correção de bugs no grid de fundo da pagina do login
- efeito de hover nos botões entrar e logins sociais 
- correção de bugs no js no fade das estrelas

## Atualização Rickelmy 21/05
- **Docker**: Colquei nosso banco de dados no **Docker**.
- **BackEnd**: Resolvi o problema de login.
- **FrontEnd**: Atualizei para quando fizer login a pessoa ir para a homepage, o suporta tbm ir para a home page e depos configurei o que faltava para o carrossel.
- **Adicionar**: Tem que colocar o light mode no Configuração.

## Atualizações Carol 21/05
- **Modal**: feito seguindo o padrão estético do site.
- **JS e CSS do Modal**: feito também. o javascript seria back-end nesse caso...

## Atualizações Lhorrany 21/05
- Separação da página de suporte
- teste de banco de dados com node (so pra ver ne)

## Atualizações Rodrigo 21/05
- Separação da loja
- Separação da biblioteca (com todas as linguagens no msm arquivo)

## Atualizações math 21/05:
- separação das paginas homepage, perfil e carrossel
- mudança de identação e comentarios nos arquivos separados 
- atualização de redirecionamentos nos arquivos da loja e da biblioteca e do carrossel
- adição de arquivo root contendo as funçoes globais de css (que serão usadas em grande parte das pags confiram o arquivo antes de fzr qlqr css!!!)
- ps louie deleta a função goto do css da pag de suporte, nao vai precisar, btw nao sei se arrumei os redirecionamentos da sua pag da uma olhada la

## Atualizações Rickelmy 22/05
- **Trocas:** Tirei o banco de dados que estava no MySQL via Docker e coloquei no mongoDB Atlas

## Atualizações math 15/06
- **fix** homepage link ficando vermelho (fixed).
- **atualização** pagina carrossel com rotatividade scroll e botões
ps: bahia pfv faz um tutorial de como abrir o BD mais intuitivo pfv to mematano aq

## Atualizações Rickelmy | 17/06
- **Responsividade**: Adicionada responsividade mobile na tela de login.
- **Backend**: Criação dos novos arquivos `BackCadastro.go` e `BackUpdatePassword.go`. O arquivo `BackUpdatePassword.go` foi implementado para gerenciar a alteração de senha na tela de `Configurações`. Também foi adicionada o Hash nas senhas.
- **Frontend**: Ajustes no design do cadastro, configurações e scripts para melhorar a estética e a responsividade. Coloquei alertas via *Toast*.
- **Correções & Refatorações**: Modificações e melhorias nos arquivos `BackLogin.go`, `Main.go` e `Struct.go`.

## Atualizações Rickelmy | 18/06
- **Autenticação JWT**: Implementado sistema de autenticação via **JWT (JSON Web Tokens)** no fluxo de login.
  - Adicionada a biblioteca `github.com/golang-jwt/v5` como dependência no projeto.
  - Criada a função `gerarTokenJWT()` no `BackLogin.go`, que gera um token assinado com o algoritmo **HS256**, contendo o email do usuário e tempo de expiração de 24 horas no payload (claims).
   - O `scriptLogin.js` pega o token e salva no `localStorage` (Seria mais seguro colocar em um Cookie no BackEnd, mas no LocalStorage é mais, o exemplo do video usava no LocalStorage).

## Atualizações Rickelmy | 20/06
- **Autenticação JWT (Frontend)**: Adicionei a função `tokenValido()` no `scriptConfiguracoes.js` que decodifica o payload do JWT e verifica se o campo `exp` ainda não expirou. Agora a página de configurações bloqueia o acesso se o token estiver ausente, inválido ou expirado, limpando o `localStorage` e redirecionando para o login.
- **Sistema de Temas (Backend)**: Adicionei o campo `Theme` na struct `Users` no `Struct.go`. No `BackCadastro.go`, todo novo usuário é cadastrado agora com o tema padrão `"neon-classic"`. O `BackLogin.go` passou a retornar o `theme` do usuário na resposta JSON do login.
- **Endpoint `/UpdateTheme`**: Criei o endpoint `POST /UpdateTheme` que recebe `{ email, theme }` e atualiza o campo `theme` no MongoDB com `$set` (sem alterar outros campos do documento).
- **Endpoint `/Me`**: Criei o **endpoint** para validar o JWT pelo header `Authorization: Bearer <token>`, extrair o email das claims e retornar `{ email, theme }` do banco. Serve para o frontend buscar os dados atualizados do usuário sem precisar fazer login novamente. Adicionei a verificação rigorosa do algoritmo de assinatura para evitar falsificação de tokens.
- **Refatoração do Backend**: Criei o **arquivo** `BackConfiguracoes.go` com as funções de alterar senha e salvar o tema do usuário no BD.
- **Comentários**: Adicionei comentários explicativos no `BackMe.go` e `BackConfiguracoes.go`.
- **Frontend (Configurações)**: A função `salvarConfiguracoes()` agora chama `POST /UpdateTheme` para persistir o tema no MongoDB ao clicar em salvar, mantendo também o salvamento no `localStorage`.   

## atualizacoes lui | 21/06
- padronizei as fontes e os tamanhos nas páginas utilizando o stylesheet de tema pra base
para utilizar a padronização do arquivo, so colocar txt-title dentro da classe;
- arrumei a barra de pesquisa da loja e agora está mais intuitiva;
- arrumei o problema das janelas fechando;
- adicionei janelas arrastaveis utilizando o gerenciadorJanelas.js linkado ao html e que ao fechar a janela, ela fica minimizada.

## Atualizações Rickelmy | 21/06
- **Struct `Users`**: Adicionei os campos `Nickname` e `BirthDate` na `Struct.go`. Usei a tag `omitempty` nos dois campos para só serem usados quando eu chamar eles.
- **Endpoint `/Me`**: Atualizei o `BackMe.go` para retornar `nickname` e `birthdate` junto com `email` e `theme`.
- **Arquivo `BackPerfil.go`**: Criei o arquivo com a estrutura inicial do endpoint `POST /UpdateProfile` — por enquanto só com CORS e validação de método. A lógica de atualização de nickname e data de nascimento será implementada quando o frontend da página de perfil estiver pronto.
- **Rota no `Main.go`**: Coloquei a rota `/UpdateProfile`.

## Atualizações Rodrigo | 21/06
- Comecei a refazer a aba de perfil, com inspirações no layout de customização de perfil do discord e steam, com também um pouco de inspiração no layout da loja do brawl stars
- Fiz as bases da pagina, só precisando agora desenvolver os containers individualmente
- Fiz um menu hamburguer com animações
- Ainda falta integrar essas alterações com o projeto, já que agora a pagina perfil está em uma nova pasta


## Atualizações Lui | 25/06

- Mudei o nome do stylesheet que padroniza as fontes e seus respectivos tamanhos para "Fontes";
- Commitei um teste de biblioteca que contém espaços para integrar dados de BD.

# Atualizações Rickelmy 25/06
- Coloquei um Captcha usando a bibliotecas `dchest/captcha` para as pessoas não encherem nosso site
com informações inúeis.

## Atualizações Carou 28~29/06

- estou colocando detalhes do que fiz em duas semanas pros temas claro e fotossensível só agora
- criei o theme.css: css que carrega as cores de temas distintos (claro e fotossensível) em váriaveis diversas.
esclarecimento: o root.css é o css que carrega apenas as cores das variáveis no tema padrão; isso é, do tema dark synthwave, o escuro padrão. ele pode coexistir com o theme.css e theme.js (já que não existe root.js)
- implementei nos HTMLs o <script src="../js/theme.js"></script> e o <link rel="stylesheet" href="../css/theme.css" /> para o theme rodar.

## Atualizações Carol 11/07
- Reativadas as variáveis --bg-main, --bg-secondary, --card-bg, --text, --text-primary, --text-secondary, --border-color e --shadow-color, que estavam comentadas e por isso não tinham valor padrão no tema escuro: causa raiz do theme.css não funcionar corretamente
- Adicionadas as fontes --vt-font (VT323) e --orb-font (Orbitron), usadas em outras páginas do site mas ausentes do root.css
