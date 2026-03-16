import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: ".env.local" });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_CONTACT_EMAIL = "subnest.ai@gmail.com";

const db = new Database("leads.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    phone TEXT,
    budget TEXT,
    timeline TEXT,
    requirements TEXT,
    score INTEGER,
    category TEXT,
    raw_chat TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

function createMailer() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

type LeadNotification = {
  name: string;
  email: string;
  rawChat: unknown[];
};

type LeadNotifier = {
  sendInterestedLeadEmail: (notification: LeadNotification) => Promise<void>;
};

function getContactEmail() {
  return process.env.NOTIFICATION_EMAIL_TO || DEFAULT_CONTACT_EMAIL;
}

function createResendNotifier(): LeadNotifier | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return null;
  }

  return {
    async sendInterestedLeadEmail({ name, email, rawChat }) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [getContactEmail()],
          reply_to: email,
          subject: `New interested SubNest lead: ${name}`,
          text: [
            "A website visitor shared their contact details with the SubNest chatbot.",
            "",
            `Name: ${name}`,
            `Email: ${email}`,
            "",
            "Conversation transcript:",
            JSON.stringify(rawChat || [], null, 2),
          ].join("\n"),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Resend API error (${response.status}): ${errorBody}`);
      }
    },
  };
}

function createSmtpNotifier(): LeadNotifier | null {
  const mailer = createMailer();

  if (!mailer) {
    return null;
  }

  return {
    async sendInterestedLeadEmail({ name, email, rawChat }) {
      await mailer.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: getContactEmail(),
        replyTo: email,
        subject: `New interested SubNest lead: ${name}`,
        text: [
          "A website visitor shared their contact details with the SubNest chatbot.",
          "",
          `Name: ${name}`,
          `Email: ${email}`,
          "",
          "Conversation transcript:",
          JSON.stringify(rawChat || [], null, 2),
        ].join("\n"),
      });
    },
  };
}

function createLeadNotifier(): LeadNotifier | null {
  return createResendNotifier() || createSmtpNotifier();
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const notifier = createLeadNotifier();

  app.use(express.json());

  // API Routes
  app.post("/api/leads", (req, res) => {
    const { name, email, phone, budget, timeline, requirements, score, category, raw_chat } = req.body;
    
    try {
      const stmt = db.prepare(`
        INSERT INTO leads (name, email, phone, budget, timeline, requirements, score, category, raw_chat)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(name, email, phone, budget, timeline, requirements, score, category, JSON.stringify(raw_chat));
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to save lead" });
    }
  });

  app.post("/api/interested-leads", async (req, res) => {
    const { name, email, raw_chat } = req.body;

    if (!name || !email) {
      res.status(400).json({ error: "Name and email are required" });
      return;
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO leads (name, email, score, category, raw_chat)
        VALUES (?, ?, ?, ?, ?)
      `);

      const result = stmt.run(name, email, 85, "Interested", JSON.stringify(raw_chat || []));

      if (!notifier) {
        console.warn("Email notifications are not configured. Interested lead saved locally only.");
        res.status(202).json({ success: true, id: result.lastInsertRowid, emailed: false });
        return;
      }

      await notifier.sendInterestedLeadEmail({
        name,
        email,
        rawChat: raw_chat || [],
      });

      res.json({ success: true, id: result.lastInsertRowid, emailed: true });
    } catch (error) {
      console.error("Interested lead processing error:", error);
      res.status(500).json({ error: "Failed to process interested lead" });
    }
  });

  app.get("/api/leads", (req, res) => {
    try {
      const leads = db.prepare("SELECT * FROM leads ORDER BY created_at DESC").all();
      res.json(leads);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
