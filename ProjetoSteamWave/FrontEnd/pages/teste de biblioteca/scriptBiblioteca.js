/* ============================================================================
   scriptBiblioteca.js  —  SteamWave · Página de Biblioteca
   ============================================================================
   ORGANIZAÇÃO DO ARQUIVO:
     1. Configuração global (endpoints, constantes)
     2. Mock local (substituto dos dados enquanto o Cosmos DB não está no ar)
     3. Camada de API — ÚNICO lugar que muda quando o backend subir
     4. Estado da página
     5. Renderização — sidebar, banner, cards individuais
     6. Player de soundtrack
     7. Modais — envio de solicitação (jogo/mod) e lightbox de mídia
     8. Seção Comunidade — posts e solicitações de comunidade
     9. Inicialização

   REGRA DE OURO:
   Nenhum dado concreto (nome de jogo, URL, número de horas…) aparece
   "chumbado" em funções de render. Tudo vem do array `bibliotecaJogos`
   e dos objetos `comunidadePosts` / `comunidadeSolicitacoes`, que por
   enquanto são preenchidos pelo mock e no futuro vêm do Cosmos DB.
   ============================================================================ */


/* ============================================================================
   1. CONFIGURAÇÃO GLOBAL
   ----------------------------------------------------------------------------
   Centralize aqui qualquer constante que possa mudar entre ambientes
   (dev / staging / produção). Quando o backend estiver pronto, basta
   alterar BASE_API_URL — nenhuma outra linha precisa mudar.
   ============================================================================ */

const CONFIG = {
    /*
     * URL base da sua API Go hospedada no Azure Container Apps.
     * Durante o desenvolvimento local você pode apontar pra:
     *   "http://localhost:8080"
     * Em produção troque pelo domínio real do Container App:
     *   "https://<seu-app>.brazilsouth.azurecontainerapps.io"
     *
     * Deixamos null enquanto o backend não existe; as funções de API
     * detectam isso e devolvem o mock em vez de fazer fetch real.
     */
    BASE_API_URL: null,

    /*
     * ID do usuário autenticado.
     * No futuro virá do sistema de autenticação (JWT / Azure AD B2C).
     * Usado como partition key no Cosmos DB (container "jogos", partition /usuarioId).
     * Por enquanto fixo pra simular um usuário logado.
     */
    USUARIO_ID: "usuario-demo-001",

    /*
     * Diretório do site onde os prints do jogador são salvos automaticamente.
     * O backend Go deve varrer esse diretório (ou o Blob Storage equivalente)
     * e devolver os arquivos já como URLs absolutas no campo `midia[]` de
     * cada jogo. O front NUNCA precisa saber de caminhos em disco — só URLs.
     *
     * Cosmos DB: este valor é apenas documentação/referência. O backend é quem
     * lê o Storage Account e injeta as URLs antes de devolver o JSON da API.
     */
    PRINTS_BLOB_CONTAINER: "prints",   // nome do container no Azure Blob Storage
};


/* ============================================================================
   2. DADOS MOCK (placeholder enquanto o Cosmos DB não está integrado)
   ----------------------------------------------------------------------------
   Formato pensado para bater com os documentos do container "jogos" no
   Cosmos DB (API NoSQL). Partition key: /usuarioId.

   Campos com valor null ou "" são exatamente os pontos preenchidos por
   URLs reais vindas do Azure Blob Storage (capas, áudios, prints).

   ATENÇÃO: quando o backend estiver no ar, este bloco inteiro pode ser
   removido sem impacto algum no resto do código.
   ============================================================================ */

/*
 * Mock: biblioteca de jogos do usuário.
 * Cosmos DB: cada objeto abaixo equivale a um DOCUMENTO no container "jogos".
 * Exemplo de query usada pelo backend Go:
 *   SELECT * FROM c WHERE c.usuarioId = @usuarioId
 */
const _mockBibliotecaJogos = [
    {
        /*
         * "id" deve ser o mesmo _id do documento no Cosmos DB.
         * O backend Go devolve este campo como retornado pelo SDK azcosmos.
         */
        id: "cyber-gato",
        usuarioId: "usuario-demo-001",   // FK lógica — partition key no Cosmos
        nome: "Cyber-Gato",
        emoji: "🐱",
        horasJogadas: 42,

        /*
         * Cosmos/Blob: a URL da capa será gerada pelo backend Go via SAS token
         * de leitura de curta duração apontando pro container "capas" do Blob.
         * Ex: "https://<account>.blob.core.windows.net/capas/cyber-gato.jpg?<sas>"
         */
        capaUrl: null,

        soundtrack: {
            faixaAtual: "Neon Alley",
            /*
             * Cosmos/Blob: URL direta do arquivo de áudio no container "soundtracks".
             * O <audio> do HTML toca diretamente do Blob — não passa pelo backend Go,
             * o que evita pagar compute/egress do Container App pra servir áudio.
             * Ex: "https://<account>.blob.core.windows.net/soundtracks/cyber-gato.mp3"
             */
            url: ""
        },

        personagemMaisJogado: {
            nome: "Kira",
            icone: "🐾",
            campanha: "Modo Noturno"
        },

        /*
         * Conquistas: "meta" sempre 100 (representa %).
         * Cosmos: armazenadas como array aninhado no documento do jogo.
         */
        conquistas: [
            { nome: "Ronronar 100 vezes",       descricao: "Use a habilidade de ronronar 100 vezes",           progresso: 92,  meta: 100 },
            { nome: "Mestre dos Becos",          descricao: "Explore todos os becos da cidade",                 progresso: 80,  meta: 100 },
            { nome: "Colecionador de Antenas",   descricao: "Encontre 20 antenas escondidas",                   progresso: 45,  meta: 100 },
            { nome: "Speedrun Noturno",          descricao: "Termine o Modo Noturno em menos de 20 min",        progresso: 100, meta: 100 }
        ],

        /*
         * Skins: "desbloqueada" NÃO é armazenada no Cosmos — é calculada em
         * tempo real aqui no front, comparando horasNecessarias x horasJogadas.
         * Isso evita inconsistência e uma gravação extra no banco.
         */
        skins: [
            { nome: "Visor Neon",        icone: "🕶️", horasNecessarias: 10  },
            { nome: "Capa Synth",        icone: "🧥", horasNecessarias: 30  },
            { nome: "Traje Holográfico", icone: "✨", horasNecessarias: 50  },
            { nome: "Máscara de Vidro",  icone: "🎭", horasNecessarias: 100 }
        ],

        /*
         * Mídia: prints tirados pelo jogador. As URLs chegam prontas do backend
         * Go, que varre o container "prints/<usuarioId>/<jogoId>/" no Blob Storage
         * e injeta os objetos neste array antes de serializar o JSON de resposta.
         * O front nunca faz upload de prints diretamente — eles já estão no Blob
         * (salvos automaticamente durante o jogo pelo cliente nativo / integração futura).
         *
         * url: null → placeholder visual enquanto não há arquivo real no Blob.
         */
        midia: [
            { id: "m001", tipo: "print", url: null, legenda: "Topo do prédio synth",   dataCaptura: "2025-03-10" },
            { id: "m002", tipo: "print", url: null, legenda: "Beco 12 ao amanhecer",   dataCaptura: "2025-03-14" }
        ],

        /*
         * Progresso: % da campanha concluída, você e seus amigos.
         * Cosmos: amigos são referenciados pelo usuarioId deles; o backend faz
         * a query cruzada e monta o array antes de devolver pro front.
         * O front não precisa saber de nenhum ID — só renderiza o que chega.
         */
        progresso: {
            jogador: { nome: "Você", percentual: 65 },
            amigos: [
                { nome: "Ana",   percentual: 80 },
                { nome: "Bruno", percentual: 40 }
            ]
        }
    },

    {
        id: "vaporworld",
        usuarioId: "usuario-demo-001",
        nome: "VaporWorld",
        emoji: "🌌",
        horasJogadas: 120,
        capaUrl: null,

        soundtrack: {
            faixaAtual: "Sunset Boulevard 2099",
            url: ""
        },

        personagemMaisJogado: {
            nome: "Reverb",
            icone: "🛰️",
            campanha: "Órbita Rosa"
        },

        conquistas: [
            { nome: "Colecionador de Discos", descricao: "Junte 50 vinis digitais",          progresso: 96, meta: 100 },
            { nome: "Viajante do Vazio",       descricao: "Visite todos os planetas synth",   progresso: 70, meta: 100 },
            { nome: "DJ Honorário",            descricao: "Monte 10 playlists na nave",        progresso: 55, meta: 100 }
        ],

        skins: [
            { nome: "Traje Lunar",    icone: "🌙", horasNecessarias: 20  },
            { nome: "Capacete Prisma", icone: "🪐", horasNecessarias: 60  },
            { nome: "Asas de Néon",   icone: "🦋", horasNecessarias: 150 }
        ],

        midia: [
            { id: "m003", tipo: "print", url: null, legenda: "Pôr do sol em Órbita Rosa", dataCaptura: "2025-04-01" }
        ],

        progresso: {
            jogador: { nome: "Você", percentual: 88 },
            amigos: [
                { nome: "Ana",   percentual: 30 },
                { nome: "Bruno", percentual: 95 },
                { nome: "Carla", percentual: 50 }
            ]
        }
    },

    {
        id: "pixelquest",
        usuarioId: "usuario-demo-001",
        nome: "PixelQuest",
        emoji: "⚔️",
        horasJogadas: 8,
        capaUrl: null,

        soundtrack: {
            faixaAtual: "8-bit Pilgrimage",
            url: ""
        },

        personagemMaisJogado: {
            nome: "Sir Byte",
            icone: "🗡️",
            campanha: "Capítulo 1: A Vila Pixelada"
        },

        conquistas: [
            { nome: "Primeiro Sangue",    descricao: "Derrote seu primeiro inimigo",    progresso: 100, meta: 100 },
            { nome: "Ferreiro Amador",    descricao: "Crie 5 armas na forja",           progresso: 60,  meta: 100 },
            { nome: "Explorador Pixelado",descricao: "Descubra 3 mapas escondidos",     progresso: 33,  meta: 100 }
        ],

        skins: [
            { nome: "Armadura de Bits", icone: "🛡️", horasNecessarias: 5  },
            { nome: "Manto do Vazio",   icone: "🌑", horasNecessarias: 25 }
        ],

        midia: [],   // ainda sem prints — o backend retornará array vazio

        progresso: {
            jogador: { nome: "Você", percentual: 12 },
            amigos: [
                { nome: "Carla", percentual: 20 }
            ]
        }
    }
];

/*
 * Mock: posts da comunidade.
 * Cosmos DB: container "comunidade", partition key /jogoId.
 * Cada documento é um post de um usuário sobre um jogo específico.
 * O backend busca os posts mais recentes/relevantes para o jogo selecionado.
 *
 * Exemplo de query Go:
 *   SELECT TOP 10 * FROM c
 *   WHERE c.jogoId = @jogoId
 *   ORDER BY c.dataCriacao DESC
 */
const _mockComunidadePosts = {
    "cyber-gato": [
        {
            id: "post-001",
            jogoId: "cyber-gato",
            autorNome: "NeonRider",
            autorAvatar: "🦊",
            tipo: "dica",         // "dica" | "discussao" | "bug" | "arte" | "conquista"
            titulo: "Como chegar ao topo do Prédio Synth em 30 segundos",
            conteudo: "Descobri um atalho no Beco 7 — depois de subir a escada metálica, pule na antena e use o dash duplo pra pegar a varanda. Economiza uns 40 segundos fácil.",
            curtidas: 34,
            comentarios: 8,
            dataCriacao: "2025-05-20T18:30:00Z"
        },
        {
            id: "post-002",
            jogoId: "cyber-gato",
            autorNome: "SynthWave99",
            autorAvatar: "🎸",
            tipo: "arte",
            titulo: "Fanart da Kira no estilo vaporwave",
            conteudo: "Passei o fim de semana fazendo isso. Compartilhando com a comunidade! (link do Blob Storage quando a integração estiver pronta)",
            /*
             * Cosmos/Blob: imagens de posts da comunidade ficam no container
             * "comunidade-midia". A URL chega pronta do backend, igual aos prints.
             */
            imagemUrl: null,
            curtidas: 71,
            comentarios: 15,
            dataCriacao: "2025-05-18T10:00:00Z"
        }
    ],
    "vaporworld": [
        {
            id: "post-003",
            jogoId: "vaporworld",
            autorNome: "OrbitaDJ",
            autorAvatar: "🌙",
            tipo: "dica",
            titulo: "Guia completo de playlists — conquista DJ Honorário",
            conteudo: "A conquista trava se você criar as playlists antes de ativar o modo Órbita. Crie 3 playlists em cada planeta, não todas de uma vez.",
            curtidas: 52,
            comentarios: 22,
            dataCriacao: "2025-05-22T14:00:00Z"
        }
    ],
    "pixelquest": [
        {
            id: "post-004",
            jogoId: "pixelquest",
            autorNome: "BitKnight",
            autorAvatar: "⚔️",
            tipo: "bug",
            titulo: "Bug na forja do Capítulo 2 — arma some do inventário",
            conteudo: "Reproduzi 3x: crie um arco e uma espada na mesma sessão, o arco some. Patch ainda não saiu. Workaround: crie em sessões separadas.",
            curtidas: 18,
            comentarios: 11,
            dataCriacao: "2025-05-21T09:45:00Z"
        }
    ]
};

/*
 * Mock: solicitações de envio (jogos/mods aguardando revisão da equipe).
 * Cosmos DB: container "solicitacoesUpload", partition key /usuarioId.
 * Campo "status": "pendente" | "aprovado" | "rejeitado"
 */
const _mockSolicitacoes = [
    {
        id: "sol-001",
        usuarioId: "usuario-demo-001",
        jogoIdRelacionado: "cyber-gato",
        tipo: "mod",
        titulo: "Mod — Modo Hardcore Noturno",
        observacoes: "Aumenta a dificuldade e adiciona novos inimigos.",
        status: "pendente",
        /*
         * Cosmos/Blob: o arquivo do mod fica no container "jogos" do Blob Storage.
         * A URL SAS gerada pelo backend é de curta duração e não fica gravada aqui.
         * Apenas os metadados (nome, tamanho, status) ficam no Cosmos.
         */
        arquivoNome: "cyber-gato-hardcore-mod-v1.zip",
        arquivoTamanhoMB: 14.2,
        dataSolicitacao: "2025-05-15T12:00:00Z"
    }
];


/* ============================================================================
   3. CAMADA DE API  —  ÚNICO lugar que muda quando o backend Cosmos DB subir
   ----------------------------------------------------------------------------
   Cada função aqui tem duas implementações:
     a) Caminho atual:  devolve o mock local (sem nenhuma rede)
     b) Caminho futuro: comentado logo abaixo, pronto pra ser descomentado

   Quando CONFIG.BASE_API_URL for preenchido, as chamadas reais entram em
   vigor automaticamente. Enquanto for null, o mock é usado sem erros.
   ============================================================================ */

/**
 * Busca a biblioteca de jogos do usuário autenticado.
 *
 * Cosmos DB (quando integrado):
 *   Container: "jogos"  |  Partition key: /usuarioId
 *   Query feita pelo backend Go:
 *     SELECT * FROM c WHERE c.usuarioId = @usuarioId
 *   O backend também injeta URLs SAS de curta duração nos campos:
 *     jogo.capaUrl, jogo.soundtrack.url, jogo.midia[*].url
 *   para que o front acesse o Blob Storage diretamente sem passar pelo Go.
 *
 * @returns {Promise<Array>} Array de objetos de jogo no formato do mock acima.
 */
async function carregarBibliotecaDaNuvem() {
    if (!CONFIG.BASE_API_URL) {
        // Backend ainda não configurado → usa mock local
        return _mockBibliotecaJogos;
    }

    /*
     * ── INTEGRAÇÃO COSMOS DB ──────────────────────────────────────────────
     * Descomente e ajuste quando o backend Go estiver no ar:
     *
     * const resposta = await fetch(
     *     `${CONFIG.BASE_API_URL}/api/biblioteca?usuarioId=${CONFIG.USUARIO_ID}`,
     *     {
     *         headers: {
     *             // Autenticação JWT emitida pelo seu backend Go / Azure AD B2C.
     *             // O token identifica o usuário e o backend valida antes de
     *             // devolver apenas os jogos daquele usuarioId (evita que um
     *             // usuário leia os dados de outro mesmo conhecendo o ID).
     *             "Authorization": `Bearer ${obterTokenJWT()}`
     *         }
     *     }
     * );
     * if (!resposta.ok) throw new Error(`Erro ao carregar biblioteca: ${resposta.status}`);
     * return await resposta.json();
     * ─────────────────────────────────────────────────────────────────────
     */
    return _mockBibliotecaJogos; // fallback de segurança
}

/**
 * Envia uma solicitação de upload de JOGO ou MOD (não de prints —
 * prints são salvos automaticamente no diretório do site/Blob).
 *
 * Cosmos DB (quando integrado):
 *   Container: "solicitacoesUpload"  |  Partition key: /usuarioId
 *   Fluxo de upload grande (recomendado pra arquivos > 10 MB):
 *     1. POST /api/upload/iniciar  → backend gera SAS token de ESCRITA no Blob
 *     2. Front faz PUT direto no Blob usando a URL SAS (não passa pelo Go)
 *     3. POST /api/upload/confirmar → backend grava metadados no Cosmos (status: "pendente")
 *   Fluxo de upload pequeno (para descrições/metadados sem arquivo grande):
 *     1. POST /api/solicitacoes-upload com JSON simples
 *
 * @param {Object} dados - Campos da solicitação (veja lidarComEnvioSolicitacao)
 * @returns {Promise<Object>} Objeto com { ok: true } ou lança erro
 */
async function enviarSolicitacaoUpload(dados) {
    if (!CONFIG.BASE_API_URL) {
        // Backend ainda não configurado → simula sucesso
        console.log("[mock] Solicitação de upload registrada localmente:", dados);
        return { ok: true };
    }

    /*
     * ── INTEGRAÇÃO COSMOS DB ──────────────────────────────────────────────
     * Para arquivos grandes (fluxo com SAS token):
     *
     * // Passo 1: pede ao backend uma URL de escrita temporária no Blob
     * const inicioResp = await fetch(`${CONFIG.BASE_API_URL}/api/upload/iniciar`, {
     *     method: "POST",
     *     headers: {
     *         "Content-Type": "application/json",
     *         "Authorization": `Bearer ${obterTokenJWT()}`
     *     },
     *     body: JSON.stringify({
     *         usuarioId:  CONFIG.USUARIO_ID,
     *         jogoId:     dados.jogoIdRelacionado,
     *         tipo:       dados.tipo,             // "jogo" | "mod"
     *         nomeArquivo: dados.arquivo.name,
     *         tamanhoBytes: dados.arquivo.size
     *     })
     * });
     * const { uploadUrl, blobPath } = await inicioResp.json();
     * // uploadUrl = URL SAS de escrita no container "jogos" do Blob Storage
     *
     * // Passo 2: envia o arquivo DIRETO pro Blob (sem passar pelo backend Go)
     * await fetch(uploadUrl, {
     *     method: "PUT",
     *     headers: { "x-ms-blob-type": "BlockBlob" },
     *     body: dados.arquivo
     * });
     *
     * // Passo 3: confirma pro backend que o upload terminou
     * const confirmResp = await fetch(`${CONFIG.BASE_API_URL}/api/upload/confirmar`, {
     *     method: "POST",
     *     headers: {
     *         "Content-Type": "application/json",
     *         "Authorization": `Bearer ${obterTokenJWT()}`
     *     },
     *     body: JSON.stringify({
     *         usuarioId:   CONFIG.USUARIO_ID,
     *         jogoId:      dados.jogoIdRelacionado,
     *         tipo:        dados.tipo,
     *         titulo:      dados.titulo,
     *         observacoes: dados.observacoes,
     *         blobPath:    blobPath            // caminho gravado no Cosmos
     *     })
     * });
     * if (!confirmResp.ok) throw new Error("Falha ao confirmar upload.");
     * return await confirmResp.json();
     * ─────────────────────────────────────────────────────────────────────
     */
    return { ok: true }; // fallback de segurança
}

/**
 * Busca posts da comunidade para um jogo específico.
 *
 * Cosmos DB (quando integrado):
 *   Container: "comunidade"  |  Partition key: /jogoId
 *   Query feita pelo backend Go:
 *     SELECT TOP @limite * FROM c
 *     WHERE c.jogoId = @jogoId
 *     ORDER BY c.dataCriacao DESC
 *
 * @param {string} jogoId - ID do jogo (partition key no Cosmos)
 * @param {number} [limite=10] - Máximo de posts a retornar
 * @returns {Promise<Array>} Array de posts no formato do mock acima
 */
async function carregarPostsComunidade(jogoId, limite = 10) {
    if (!CONFIG.BASE_API_URL) {
        // Backend ainda não configurado → usa mock local filtrado por jogoId
        return (_mockComunidadePosts[jogoId] || []).slice(0, limite);
    }

    /*
     * ── INTEGRAÇÃO COSMOS DB ──────────────────────────────────────────────
     * const resposta = await fetch(
     *     `${CONFIG.BASE_API_URL}/api/comunidade?jogoId=${jogoId}&limite=${limite}`,
     *     { headers: { "Authorization": `Bearer ${obterTokenJWT()}` } }
     * );
     * if (!resposta.ok) throw new Error(`Erro ao carregar comunidade: ${resposta.status}`);
     * return await resposta.json();
     * ─────────────────────────────────────────────────────────────────────
     */
    return (_mockComunidadePosts[jogoId] || []).slice(0, limite);
}

/**
 * Busca as solicitações de upload do usuário (histórico + status atual).
 *
 * Cosmos DB (quando integrado):
 *   Container: "solicitacoesUpload"  |  Partition key: /usuarioId
 *   Query:
 *     SELECT * FROM c
 *     WHERE c.usuarioId = @usuarioId
 *     ORDER BY c.dataSolicitacao DESC
 *
 * @returns {Promise<Array>} Array de solicitações no formato do mock acima
 */
async function carregarMinhasSolicitacoes() {
    if (!CONFIG.BASE_API_URL) {
        return _mockSolicitacoes.filter(s => s.usuarioId === CONFIG.USUARIO_ID);
    }

    /*
     * ── INTEGRAÇÃO COSMOS DB ──────────────────────────────────────────────
     * const resposta = await fetch(
     *     `${CONFIG.BASE_API_URL}/api/solicitacoes?usuarioId=${CONFIG.USUARIO_ID}`,
     *     { headers: { "Authorization": `Bearer ${obterTokenJWT()}` } }
     * );
     * if (!resposta.ok) throw new Error(`Erro ao carregar solicitações: ${resposta.status}`);
     * return await resposta.json();
     * ─────────────────────────────────────────────────────────────────────
     */
    return _mockSolicitacoes.filter(s => s.usuarioId === CONFIG.USUARIO_ID);
}

/**
 * Envia uma curtida num post da comunidade.
 *
 * Cosmos DB (quando integrado):
 *   Operação de patch no documento do post:
 *     PATCH /comunidade/<postId>  →  { "curtidas": c.curtidas + 1 }
 *   O backend Go usa a operação de Patch Parcial do SDK azcosmos pra evitar
 *   race condition (não faz read-modify-write, usa operação atômica).
 *
 * @param {string} postId - ID do post no Cosmos
 * @param {string} jogoId - Partition key do container "comunidade"
 */
async function curtirPost(postId, jogoId) {
    if (!CONFIG.BASE_API_URL) {
        // Mock: apenas simula sucesso
        console.log(`[mock] Curtida no post ${postId} registrada localmente.`);
        return { ok: true };
    }

    /*
     * ── INTEGRAÇÃO COSMOS DB ──────────────────────────────────────────────
     * const resposta = await fetch(
     *     `${CONFIG.BASE_API_URL}/api/comunidade/${postId}/curtir`,
     *     {
     *         method: "POST",
     *         headers: {
     *             "Content-Type": "application/json",
     *             "Authorization": `Bearer ${obterTokenJWT()}`
     *         },
     *         body: JSON.stringify({ jogoId })   // partition key necessária pro Cosmos
     *     }
     * );
     * if (!resposta.ok) throw new Error("Falha ao registrar curtida.");
     * return await resposta.json();
     * ─────────────────────────────────────────────────────────────────────
     */
    return { ok: true };
}

/*
 * Helper: retorna o JWT do usuário autenticado.
 * Cosmos DB: o backend Go valida este token antes de qualquer operação.
 * Implementação real: ler do localStorage, sessionStorage ou memória,
 * dependendo do sistema de autenticação escolhido (Azure AD B2C, JWT próprio…).
 */
function obterTokenJWT() {
    // TODO: implementar quando autenticação estiver no ar
    return "jwt-placeholder";
}


/* ============================================================================
   4. ESTADO DA PÁGINA
   ============================================================================ */
let bibliotecaJogos      = [];    // preenchido em inicializarBiblioteca()
let jogoSelecionadoId    = null;  // ID do jogo com detalhes abertos no main
let midiaSelecionadaAtual = null; // item de mídia aberto no lightbox


/* ============================================================================
   5. RENDERIZAÇÃO
   ============================================================================ */

/** Constrói a lista de jogos na sidebar a partir de `bibliotecaJogos`. */
function renderizarListaJogos() {
    const container = document.getElementById("bibGameList");
    container.innerHTML = "";

    bibliotecaJogos.forEach((jogo) => {
        const item = document.createElement("div");
        item.className = "bib-game-item" + (jogo.id === jogoSelecionadoId ? " active" : "");
        item.dataset.jogoId = jogo.id;

        const mediaConquistas = calcularMediaConquistas(jogo);

        item.innerHTML = `
            <div class="bib-game-item-top">
                <span>${jogo.emoji}</span>
                <span>${jogo.nome}</span>
            </div>
            <span class="bib-game-item-hours">${jogo.horasJogadas}h jogadas</span>
            <div class="bib-mini-progress" title="${mediaConquistas}% das conquistas">
                <div class="bib-mini-progress-fill" style="width:${mediaConquistas}%"></div>
            </div>
        `;

        item.addEventListener("click", () => selecionarJogo(jogo.id));
        container.appendChild(item);
    });
}

/** Troca o jogo "ativo" e atualiza todos os cards + comunidade. */
async function selecionarJogo(jogoId) {
    const jogo = bibliotecaJogos.find((j) => j.id === jogoId);
    if (!jogo) return;

    jogoSelecionadoId = jogoId;

    // Atualiza destaque visual na sidebar
    document.querySelectorAll(".bib-game-item").forEach((el) => {
        el.classList.toggle("active", el.dataset.jogoId === jogoId);
    });

    renderizarBanner(jogo);
    tocarTrilhaSonora(jogo);
    renderizarPersonagem(jogo);
    renderizarConquistasProximas(jogo);
    renderizarSkins(jogo);
    renderizarMidia(jogo);
    renderizarProgresso(jogo);

    // Seção comunidade depende do jogoId — busca na API (ou mock) e re-renderiza
    await renderizarComunidade(jogo);
}

function renderizarBanner(jogo) {
    const banner = document.getElementById("bibGameBanner");

    // Se houver capa real (URL do Blob Storage), usa como fundo; senão cai no emoji
    const estiloFundo = jogo.capaUrl
        ? `style="background-image:url('${jogo.capaUrl}'); background-size:cover; background-position:center;"`
        : "";

    banner.innerHTML = `
        <span class="bib-game-banner-emoji" ${jogo.capaUrl ? 'style="display:none"' : ""}>${jogo.emoji}</span>
        <div class="bib-game-banner-title">${jogo.nome}</div>
        <div class="bib-game-banner-hours">${jogo.horasJogadas}h jogadas</div>
    `;

    if (jogo.capaUrl) {
        banner.style.backgroundImage = `url('${jogo.capaUrl}')`;
        banner.style.backgroundSize = "cover";
        banner.style.backgroundPosition = "center";
    } else {
        banner.style.backgroundImage = "";
    }
}

function renderizarPersonagem(jogo) {
    const el = document.getElementById("bibPersonagemContent");
    const p  = jogo.personagemMaisJogado;

    if (!p) {
        el.innerHTML = `<p class="bib-empty-msg">Sem dados de personagem ainda.</p>`;
        return;
    }

    el.innerHTML = `
        <div class="bib-personagem">
            <span class="bib-personagem-icon">${p.icone}</span>
            <div>
                <div class="bib-personagem-nome">${p.nome}</div>
                <div class="bib-personagem-campanha">${p.campanha}</div>
            </div>
        </div>
    `;
}

/**
 * Conquistas mais próximas de completar (excluindo as já em 100%), limitadas a 3.
 * Ordenadas da maior porcentagem pra menor (mais perto de completar primeiro).
 */
function renderizarConquistasProximas(jogo) {
    const el = document.getElementById("bibConquistasContent");

    const proximas = jogo.conquistas
        .filter((c) => c.progresso < c.meta)
        .sort((a, b) => (b.progresso / b.meta) - (a.progresso / a.meta))
        .slice(0, 3);

    if (proximas.length === 0) {
        el.innerHTML = `<p class="bib-empty-msg">Todas as conquistas já desbloqueadas! 🎉</p>`;
        return;
    }

    el.innerHTML = proximas.map((c) => {
        const pct = Math.round((c.progresso / c.meta) * 100);
        return `
            <div class="bib-achievement">
                <div class="bib-achievement-top">
                    <span class="bib-achievement-name">${c.nome}</span>
                    <span class="bib-achievement-percent">${pct}%</span>
                </div>
                <div class="bib-achievement-desc">${c.descricao}</div>
                <div class="bib-progress-bar">
                    <div class="bib-progress-bar-fill" style="width:${pct}%"></div>
                </div>
            </div>
        `;
    }).join("");
}

/**
 * Skins calculadas em tempo real: compara horasNecessarias x horasJogadas.
 * O campo "desbloqueada" não existe no Cosmos — é derivado aqui.
 */
function renderizarSkins(jogo) {
    const el = document.getElementById("bibSkinsContent");

    el.innerHTML = jogo.skins.map((skin) => {
        const desbloqueada = jogo.horasJogadas >= skin.horasNecessarias;
        return `
            <div class="bib-skin ${desbloqueada ? "unlocked" : "locked"}">
                <span class="bib-skin-icon">${desbloqueada ? skin.icone : "🔒"}</span>
                <span>${skin.nome}</span>
                <span class="bib-skin-requirement">
                    ${desbloqueada ? "Desbloqueada" : `${skin.horasNecessarias}h necessárias`}
                </span>
            </div>
        `;
    }).join("");
}

/**
 * Galeria de prints do jogador.
 *
 * Os prints NÃO são enviados por aqui — eles são salvos automaticamente no
 * diretório do site / Blob Storage durante o jogo. O backend Go varre o
 * container "prints/<usuarioId>/<jogoId>/" e injeta as URLs no array
 * jogo.midia[] antes de devolver o JSON da biblioteca pro front.
 *
 * O que renderizamos aqui:
 *   - Itens com url real → imagem de fundo no thumbnail
 *   - Itens com url null → placeholder visual (ainda não sincronizado com o Blob)
 *
 * O botão "+ Enviar jogo/mod" abre o modal de SOLICITAÇÃO (não de print).
 */
function renderizarMidia(jogo) {
    const el = document.getElementById("bibMidiaContent");

    if (jogo.midia.length === 0) {
        el.innerHTML = `
            <p class="bib-empty-msg">
                Nenhum print encontrado. Eles aparecem automaticamente quando
                você captura telas dentro do jogo.
            </p>
        `;
        return;
    }

    el.innerHTML = jogo.midia.map((item, indice) => {
        const temUrl         = Boolean(item.url);
        const estiloFundo    = temUrl ? `style="background-image:url('${item.url}')"` : "";
        const dataFormatada  = item.dataCaptura
            ? new Date(item.dataCaptura).toLocaleDateString("pt-BR")
            : "";

        return `
            <div class="bib-midia-item" data-midia-indice="${indice}" ${estiloFundo}
                 title="${item.legenda || ""}" role="button" tabindex="0"
                 aria-label="Ver print: ${item.legenda || "sem legenda"}">
                ${temUrl ? "" : `<span class="bib-midia-item-icon">🖼️</span>`}
                <span class="bib-midia-item-label">${item.legenda || ""}${dataFormatada ? `<br><small>${dataFormatada}</small>` : ""}</span>
            </div>
        `;
    }).join("");

    // Liga cada thumbnail ao lightbox
    el.querySelectorAll(".bib-midia-item").forEach((thumb) => {
        const abrirHandler = () => {
            const indice = Number(thumb.dataset.midiaIndice);
            abrirLightbox(jogo.midia[indice]);
        };
        thumb.addEventListener("click",   abrirHandler);
        thumb.addEventListener("keydown", (e) => { if (e.key === "Enter") abrirHandler(); });
    });
}

/** Barra de progresso: você x amigos. */
function renderizarProgresso(jogo) {
    const el = document.getElementById("bibProgressoContent");
    const { jogador, amigos } = jogo.progresso;

    const linhas = [{ ...jogador, isYou: true }, ...amigos.map((a) => ({ ...a, isYou: false }))];

    el.innerHTML = linhas.map((p) => `
        <div class="bib-progresso-row ${p.isYou ? "is-you" : ""}">
            <span class="bib-progresso-avatar">${p.isYou ? "🟣" : "👤"}</span>
            <div class="bib-progresso-bar-wrap">
                <div class="bib-progresso-nome">
                    <span>${p.nome}</span>
                    <span>${p.percentual}%</span>
                </div>
                <div class="bib-progress-bar">
                    <div class="bib-progress-bar-fill" style="width:${p.percentual}%"></div>
                </div>
            </div>
        </div>
    `).join("");
}

/** Calcula a média de progresso das conquistas (0–100), usado na mini barra da sidebar. */
function calcularMediaConquistas(jogo) {
    if (!jogo.conquistas || jogo.conquistas.length === 0) return 0;
    const soma = jogo.conquistas.reduce((acc, c) => acc + (c.progresso / c.meta) * 100, 0);
    return Math.round(soma / jogo.conquistas.length);
}

/* ─────────────── Labels dos tipos de post ─────────────── */
const TIPO_POST_LABEL = {
    dica:       { label: "💡 Dica",       cls: "tag-dica"       },
    discussao:  { label: "💬 Discussão",  cls: "tag-discussao"  },
    bug:        { label: "🐛 Bug",        cls: "tag-bug"        },
    arte:       { label: "🎨 Arte",       cls: "tag-arte"       },
    conquista:  { label: "🏆 Conquista",  cls: "tag-conquista"  }
};

/**
 * Renderiza a seção Comunidade com posts do jogo selecionado.
 * Busca os posts via carregarPostsComunidade() (Cosmos DB no futuro).
 */
async function renderizarComunidade(jogo) {
    const postsEl  = document.getElementById("bibComunidadePosts");
    const titleEl  = document.getElementById("bibComunidadeJogoNome");

    if (titleEl) titleEl.textContent = jogo.nome;

    postsEl.innerHTML = `<p class="bib-loading">Carregando posts…</p>`;

    let posts = [];
    try {
        posts = await carregarPostsComunidade(jogo.id);
    } catch (err) {
        postsEl.innerHTML = `<p class="bib-empty-msg">Não foi possível carregar os posts. Tente novamente.</p>`;
        console.error("Erro ao carregar comunidade:", err);
        return;
    }

    if (posts.length === 0) {
        postsEl.innerHTML = `
            <p class="bib-empty-msg">Nenhum post ainda para ${jogo.nome}. Seja o primeiro!</p>
        `;
        return;
    }

    postsEl.innerHTML = posts.map((post) => {
        const tipoInfo  = TIPO_POST_LABEL[post.tipo] || { label: post.tipo, cls: "" };
        const dataFmt   = new Date(post.dataCriacao).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "short", year: "numeric"
        });

        return `
            <article class="bib-post" data-post-id="${post.id}" data-jogo-id="${post.jogoId}">
                <div class="bib-post-header">
                    <span class="bib-post-avatar">${post.autorAvatar}</span>
                    <div class="bib-post-meta">
                        <span class="bib-post-autor">${post.autorNome}</span>
                        <span class="bib-post-data">${dataFmt}</span>
                    </div>
                    <span class="bib-post-tag ${tipoInfo.cls}">${tipoInfo.label}</span>
                </div>
                <h4 class="bib-post-titulo">${post.titulo}</h4>
                <p class="bib-post-conteudo">${post.conteudo}</p>
                ${post.imagemUrl
                    ? `<div class="bib-post-imagem" style="background-image:url('${post.imagemUrl}')"></div>`
                    : ""}
                <div class="bib-post-actions">
                    <button class="bib-post-curtir" data-post-id="${post.id}" data-jogo-id="${post.jogoId}"
                            aria-label="Curtir post">
                        ♥ <span class="bib-curtidas-count">${post.curtidas}</span>
                    </button>
                    <span class="bib-post-comentarios">💬 ${post.comentarios}</span>
                </div>
            </article>
        `;
    }).join("");

    // Liga o evento de curtida em cada botão gerado
    postsEl.querySelectorAll(".bib-post-curtir").forEach((btn) => {
        btn.addEventListener("click", () => lidarComCurtida(btn));
    });

    // Renderiza também o painel de "Minhas solicitações" ao lado
    await renderizarMinhasSolicitacoes();
}

/**
 * Lida com clique em "curtir" um post.
 * Atualiza o contador visualmente de imediato (optimistic update) e
 * sincroniza com o Cosmos via curtirPost().
 */
async function lidarComCurtida(btn) {
    const postId = btn.dataset.postId;
    const jogoId = btn.dataset.jogoId;
    const countEl = btn.querySelector(".bib-curtidas-count");

    // Optimistic update: já mostra +1 antes da resposta da API
    const valorAtual = parseInt(countEl.textContent, 10) || 0;
    countEl.textContent = valorAtual + 1;
    btn.disabled = true; // evita múltiplos cliques antes da resposta

    try {
        await curtirPost(postId, jogoId);
    } catch (err) {
        // Reverte se a API falhou
        countEl.textContent = valorAtual;
        btn.disabled = false;
        console.error("Erro ao curtir post:", err);
    }
}

/**
 * Renderiza o painel de solicitações de upload do usuário
 * (histórico de jogos/mods enviados para revisão).
 */
async function renderizarMinhasSolicitacoes() {
    const el = document.getElementById("bibSolicitacoesContent");
    if (!el) return;

    el.innerHTML = `<p class="bib-loading">Carregando solicitações…</p>`;

    let solicitacoes = [];
    try {
        solicitacoes = await carregarMinhasSolicitacoes();
    } catch (err) {
        el.innerHTML = `<p class="bib-empty-msg">Não foi possível carregar suas solicitações.</p>`;
        return;
    }

    if (solicitacoes.length === 0) {
        el.innerHTML = `<p class="bib-empty-msg">Você ainda não enviou nenhuma solicitação.</p>`;
        return;
    }

    const STATUS_LABEL = {
        pendente:  { label: "⏳ Pendente",  cls: "status-pendente"  },
        aprovado:  { label: "✅ Aprovado",  cls: "status-aprovado"  },
        rejeitado: { label: "❌ Rejeitado", cls: "status-rejeitado" }
    };

    el.innerHTML = solicitacoes.map((sol) => {
        const s      = STATUS_LABEL[sol.status] || { label: sol.status, cls: "" };
        const dataFmt = new Date(sol.dataSolicitacao).toLocaleDateString("pt-BR");
        return `
            <div class="bib-solicitacao">
                <div class="bib-solicitacao-top">
                    <span class="bib-solicitacao-titulo">${sol.titulo}</span>
                    <span class="bib-solicitacao-status ${s.cls}">${s.label}</span>
                </div>
                <div class="bib-solicitacao-meta">
                    ${sol.tipo === "jogo" ? "Jogo completo" : "Mod / arquivo"} ·
                    ${sol.arquivoNome || "sem arquivo"} ·
                    ${dataFmt}
                </div>
            </div>
        `;
    }).join("");
}


/* ============================================================================
   6. PLAYER DE SOUNDTRACK
   ============================================================================ */

function tocarTrilhaSonora(jogo) {
    const audio     = document.getElementById("bibAudio");
    const trackLabel = document.getElementById("bibSoundtrackTrack");
    const equalizer = document.getElementById("bibEqualizer");
    const toggleBtn = document.getElementById("bibSoundtrackToggle");

    trackLabel.textContent = jogo.soundtrack.faixaAtual || "—";

    /*
     * Cosmos/Blob: jogo.soundtrack.url aponta pro arquivo de áudio diretamente
     * no Azure Blob Storage (container "soundtracks"). O <audio> toca diretamente
     * da URL do Blob — não passa pelo backend Go (economiza egress do Container App).
     * Enquanto estiver vazio (mock), simplesmente não toca.
     */
    if (!jogo.soundtrack.url) {
        audio.removeAttribute("src");
        equalizer.classList.remove("playing");
        toggleBtn.textContent = "▶";
        return;
    }

    audio.src = jogo.soundtrack.url;

    // Navegadores modernos bloqueiam autoplay sem interação prévia do usuário.
    // O catch() trata isso silenciosamente: música fica pausada, botão ▶ disponível.
    audio.play()
        .then(() => { equalizer.classList.add("playing"); toggleBtn.textContent = "⏸"; })
        .catch(() => { equalizer.classList.remove("playing"); toggleBtn.textContent = "▶"; });
}

function alternarSoundtrack() {
    const audio     = document.getElementById("bibAudio");
    const equalizer = document.getElementById("bibEqualizer");
    const toggleBtn = document.getElementById("bibSoundtrackToggle");

    if (!audio.src || !audio.src.startsWith("http")) return; // sem URL real ainda

    if (audio.paused) {
        audio.play();
        equalizer.classList.add("playing");
        toggleBtn.textContent = "⏸";
    } else {
        audio.pause();
        equalizer.classList.remove("playing");
        toggleBtn.textContent = "▶";
    }
}


/* ============================================================================
   7. MODAIS — solicitação de jogo/mod e lightbox de mídia
   ----------------------------------------------------------------------------
   IMPORTANTE: o modal de upload aqui aceita SOMENTE jogos e mods.
   Prints NÃO são enviados manualmente — eles chegam automaticamente pelo
   backend Go, que varre o Blob Storage e injeta as URLs no campo midia[].
   ============================================================================ */

function abrirModalUpload() {
    document.getElementById("bibUploadModalOverlay").classList.add("open");
}

function fecharModalUpload() {
    document.getElementById("bibUploadModalOverlay").classList.remove("open");
    document.getElementById("bibUploadStatus").textContent = "";
    document.getElementById("bibUploadForm").reset();
    // Reseta o indicador de progresso de upload
    const progressEl = document.getElementById("bibUploadProgress");
    if (progressEl) progressEl.style.display = "none";
}

/**
 * Lida com o submit do formulário de solicitação de upload.
 *
 * Fluxo resumido:
 *   1. Coleta os dados do form
 *   2. Valida se o arquivo está presente (obrigatório pra jogo/mod)
 *   3. Chama enviarSolicitacaoUpload() — que no futuro usa SAS token + Blob
 *   4. Mostra status de sucesso ou erro ao usuário
 */
async function lidarComEnvioSolicitacao(evento) {
    evento.preventDefault();

    const statusEl   = document.getElementById("bibUploadStatus");
    const arquivoInput = document.getElementById("bibUploadArquivo");
    const submitBtn  = evento.target.querySelector("button[type='submit']");

    // Jogo relacionado: o que estiver selecionado no momento
    const jogo = bibliotecaJogos.find((j) => j.id === jogoSelecionadoId);

    const dados = {
        tipo:               document.getElementById("bibUploadTipo").value,   // "jogo" | "mod"
        titulo:             document.getElementById("bibUploadTitulo").value,
        observacoes:        document.getElementById("bibUploadObs").value,
        jogoIdRelacionado:  jogo ? jogo.id : null,
        usuarioId:          CONFIG.USUARIO_ID,
        arquivo:            arquivoInput.files[0] || null
    };

    // Validação: arquivo é obrigatório para jogos e mods
    if (!dados.arquivo) {
        statusEl.textContent = "Selecione o arquivo do jogo ou mod antes de enviar.";
        statusEl.className   = "bib-modal-status bib-status-erro";
        return;
    }

    statusEl.textContent = "Enviando solicitação…";
    statusEl.className   = "bib-modal-status";
    submitBtn.disabled   = true;

    try {
        await enviarSolicitacaoUpload(dados);
        statusEl.textContent = "Solicitação registrada! Nossa equipe revisa em breve.";
        statusEl.className   = "bib-modal-status bib-status-ok";
        document.getElementById("bibUploadForm").reset();

        // Atualiza o painel de solicitações na seção comunidade, se visível
        await renderizarMinhasSolicitacoes();
    } catch (err) {
        statusEl.textContent = "Não foi possível enviar agora. Tenta de novo mais tarde.";
        statusEl.className   = "bib-modal-status bib-status-erro";
        console.error("Erro ao enviar solicitação de upload:", err);
    } finally {
        submitBtn.disabled = false;
    }
}

function abrirLightbox(itemMidia) {
    midiaSelecionadaAtual = itemMidia;
    const conteudo = document.getElementById("bibLightboxContent");

    conteudo.innerHTML = itemMidia.url
        ? `<img src="${itemMidia.url}" alt="${itemMidia.legenda || "print do jogador"}">`
        : `<p class="bib-empty-msg">Este print ainda não tem arquivo no servidor (Blob Storage pendente).</p>`;

    document.getElementById("bibLightboxOverlay").classList.add("open");
}

function fecharLightbox() {
    document.getElementById("bibLightboxOverlay").classList.remove("open");
    midiaSelecionadaAtual = null;
}


/* ============================================================================
   8. INICIALIZAÇÃO
   ============================================================================ */

async function inicializarBiblioteca() {

    /* ── Liga eventos globais ── */
    document.getElementById("bibSoundtrackToggle")
        .addEventListener("click", alternarSoundtrack);

    document.getElementById("bibUploadJogoBtn")
        .addEventListener("click", abrirModalUpload);

    document.getElementById("bibUploadModalClose")
        .addEventListener("click", fecharModalUpload);

    document.getElementById("bibUploadForm")
        .addEventListener("submit", lidarComEnvioSolicitacao);

    document.getElementById("bibLightboxClose")
        .addEventListener("click", fecharLightbox);

    // Fecha modais clicando fora da caixa (no overlay semi-transparente)
    document.getElementById("bibUploadModalOverlay")
        .addEventListener("click", (e) => { if (e.target.id === "bibUploadModalOverlay") fecharModalUpload(); });

    document.getElementById("bibLightboxOverlay")
        .addEventListener("click", (e) => { if (e.target.id === "bibLightboxOverlay") fecharLightbox(); });

    /* ── Carrega a biblioteca (hoje: mock / no futuro: Cosmos DB via API Go) ── */
    try {
        bibliotecaJogos = await carregarBibliotecaDaNuvem();
    } catch (err) {
        document.getElementById("bibGameList").innerHTML =
            `<p class="bib-empty-msg">Não foi possível carregar a biblioteca. Tente recarregar a página.</p>`;
        console.error("Erro ao inicializar biblioteca:", err);
        return;
    }

    if (bibliotecaJogos.length > 0) {
        jogoSelecionadoId = bibliotecaJogos[0].id;
        renderizarListaJogos();
        await selecionarJogo(jogoSelecionadoId); // renderiza tudo + comunidade
    } else {
        document.getElementById("bibGameList").innerHTML =
            `<p class="bib-empty-msg">Você ainda não tem jogos na biblioteca.</p>`;
    }
}

document.addEventListener("DOMContentLoaded", inicializarBiblioteca);
