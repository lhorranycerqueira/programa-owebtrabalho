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
* **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (Certifique-se de que o Docker esteja rodando antes de subir o banco)
### Instalação de Dependências
Abra o terminal na pasta do BackEnd do projeto e execute os comandos abaixo para baixar as dependências:
```bash
go get [github.com/go-sql-driver/mysql](https://github.com/go-sql-driver/mysql)
```
```bash
go get [github.com/joho/godotenv](https://github.com/joho/godotenv)
```
### Iniciando o Banco de Dados
Suba o container do banco de dados com o Docker:
```bash
docker-compose up -d
```
### Inicie o BackEnd
Após subir o banco, inicie o servido:
```bash
go run .
``` 

## anotações do que cada um está fazendo! (atualizem conforme forem fazendo por favor)
carol: produzindo (e aprendendo como fazer) o back end do formulário do cadastro

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

## Atualizações Carol 21/05
- **Modal**: feito seguindo o padrão estético do site.
- **JS e CSS do Modal**: feito também. o javascript seria back-end nesse caso...
eu to chorando o rickelmy parece um personagem animado na aula da celide KKKMKKMKMKM
