// ============================================================
// server.js — Servidor de teste SteamWave
//
// O que faz:
//   · Recebe tickets via POST /api/ticket
//   · Salva os tickets em tickets.json (simula um banco de dados)
//   · Envia e-mail de confirmação usando Ethereal (e-mail falso
//     de teste — nenhuma configuração real necessária)
//   · Serve o index.html via GET /
//
// Para rodar:
//   node server.js
//
// Dependências:
//   npm install express nodemailer cors
// ============================================================

const express    = require("express");
const nodemailer = require("nodemailer");
const cors       = require("cors");
const fs         = require("fs");
const path       = require("path");

const app  = express();
const PORT = 3000;

// Arquivo JSON que vai guardar os tickets (nosso "banco de dados" de teste)
const DB_FILE = path.join(__dirname, "tickets.json");


// ===== MIDDLEWARES =====
app.use(cors());                   // permite requisições de qualquer origem
app.use(express.json());           // lê o corpo das requisições como JSON
app.use(express.static(__dirname)); // serve arquivos estáticos (index.html)


// ===== BANCO DE DADOS (arquivo JSON) =====

// Lê os tickets salvos, ou retorna array vazio se o arquivo não existir
function lerTickets() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

// Salva a lista de tickets no arquivo JSON
function salvarTickets(tickets) {
  fs.writeFileSync(DB_FILE, JSON.stringify(tickets, null, 2), "utf-8");
}


// ===== CONFIGURAÇÃO DE E-MAIL (Ethereal) =====
// Ethereal cria uma conta de e-mail FALSA automaticamente.
// Nenhum e-mail chega de verdade — você visualiza tudo em
// https://ethereal.email depois de rodar o servidor.
// Para produção, troque por Gmail, SendGrid, etc.

async function criarTransporte() {
  // Cria uma conta de teste Ethereal (válida por ~24h)
  const contaTeste = await nodemailer.createTestAccount();

  console.log("\n📧 Conta de e-mail de teste criada:");
  console.log("   Usuário:", contaTeste.user);
  console.log("   Senha:  ", contaTeste.pass);
  console.log("   Ver e-mails enviados em: https://ethereal.email\n");

  // Retorna um transporte SMTP configurado com a conta teste
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: contaTeste.user,
      pass: contaTeste.pass,
    },
  });
}


// ===== ROTAS =====

// GET / — serve a página de teste
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// GET /api/tickets — retorna todos os tickets salvos
app.get("/api/tickets", (req, res) => {
  const tickets = lerTickets();
  res.json(tickets);
});

// POST /api/ticket — recebe um novo ticket
// Body esperado: { assunto: string, mensagem: string, email: string }
app.post("/api/ticket", async (req, res) => {
  const { assunto, mensagem, email } = req.body;

  // Validação básica dos campos obrigatórios
  if (!assunto || !mensagem || !email) {
    return res.status(400).json({
      ok: false,
      erro: "Preencha todos os campos: assunto, mensagem e email.",
    });
  }

  // ── 1. Monta o objeto do ticket ──────────────────────────
  const novoTicket = {
    id:        Date.now(),                          // ID único baseado no timestamp
    assunto,
    mensagem,
    email,
    status:    "aberto",
    data:      new Date().toLocaleString("pt-BR"),  // data/hora de criação
  };

  // ── 2. Salva no "banco de dados" (tickets.json) ──────────
  const tickets = lerTickets();
  tickets.push(novoTicket);
  salvarTickets(tickets);
  console.log(`✅ Ticket #${novoTicket.id} salvo. Total: ${tickets.length} ticket(s).`);

  // ── 3. Envia e-mail de confirmação via Ethereal ──────────
  try {
    const info = await transporte.sendMail({
      from:    '"Suporte SteamWave" <suporte@steamwave.com>',
      to:      email,                                // e-mail do usuário
      subject: `[Ticket Aberto] ${assunto}`,
      html: `
        <h2 style="color:#000080">Ticket recebido! ✅</h2>
        <p>Olá! Recebemos seu ticket e responderemos em até 24h.</p>
        <hr/>
        <p><strong>Assunto:</strong> ${assunto}</p>
        <p><strong>Mensagem:</strong> ${mensagem}</p>
        <p><strong>Data:</strong> ${novoTicket.data}</p>
        <p><strong>ID do ticket:</strong> #${novoTicket.id}</p>
        <hr/>
        <p style="color:#888;font-size:12px">SteamWave Support System</p>
      `,
    });

    // URL para visualizar o e-mail no painel do Ethereal
    const urlPreview = nodemailer.getTestMessageUrl(info);
    console.log(`📨 E-mail enviado! Visualize em: ${urlPreview}`);

    // Retorna sucesso com o link de preview do e-mail
    res.json({ ok: true, ticket: novoTicket, emailPreview: urlPreview });

  } catch (errEmail) {
    // Se o e-mail falhar, o ticket já foi salvo — retorna aviso parcial
    console.error("⚠️  Erro ao enviar e-mail:", errEmail.message);
    res.json({
      ok: true,
      ticket: novoTicket,
      aviso: "Ticket salvo, mas o e-mail não foi enviado.",
    });
  }
});


// ===== INICIALIZAÇÃO DO SERVIDOR =====
let transporte; // variável global para reutilizar o transporte SMTP

async function iniciar() {
  transporte = await criarTransporte(); // cria a conta Ethereal antes de abrir o servidor

  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📋 Ver tickets salvos: http://localhost:${PORT}/api/tickets\n`);
  });
}

iniciar();
