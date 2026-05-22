## reunindo ideais
estetica vaporwave
trocar a homepage - colocar as pastinhas fofas e os troço que parece página
talvez trabalhar banco de dados e login
documentação se der tempo

## dedfinir funcionalidades principais

as páginas serão: homepage, loja, biblioteca, perfil, login, configurações
- pensar nos wireframes disso tb
SteamWave 
pensar na estrutura

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
Abra o terminal na pasta do BackEnd do projeto e execute os comandos abaixo para baixar as dependências:
```bash
go get go.mongodb.org/mongo-driver/mongo
```
```bash
go get github.com/joho/godotenv
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
