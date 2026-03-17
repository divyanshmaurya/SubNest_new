import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_CONTACT_EMAIL = 'subnest.ai@gmail.com';

type EmailProvider = 'gmail' | 'smtp' | 'resend' | 'none';

type EmailDebugInfo = {
  provider: EmailProvider;
  configured: boolean;
  contactEmail: string;
  gmail: {
    hasUser: boolean;
    hasAppPassword: boolean;
  };
  resend: {
    hasApiKey: boolean;
    hasEmailFrom: boolean;
  };
  smtp: {
    hasHost: boolean;
    hasUser: boolean;
    hasPass: boolean;
    hasFrom: boolean;
  };
  error?: string;
};

type LeadEmailPayload = {
  leadName: string;
  phone: string;
  email: string;
  intent: string;
  audienceType: string;
  market: string;
  goals: string;
  timeline: string;
  currentSetup: string;
  painPoint: string;
  demoInterest: string;
  contactPreference: string;
  bestTime: string;
  score: number;
  scoreReason: string;
  category: string;
  analysis: string;
  rawChat: unknown[];
};

type SendLeadEmailOptions = {
  payload: LeadEmailPayload;
  subject: string;
  htmlBody: string;
  textBody: string;
};

type LeadNotifier = {
  provider: Exclude<EmailProvider, 'none'>;
  sendLeadEmail: (options: SendLeadEmailOptions) => Promise<void>;
};

const db = new Database('leads.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    phone TEXT,
    intent TEXT,
    audience_type TEXT,
    market TEXT,
    goals TEXT,
    timeline TEXT,
    current_setup TEXT,
    pain_point TEXT,
    demo_interest TEXT,
    contact_preference TEXT,
    best_time TEXT,
    requirements TEXT,
    score INTEGER,
    score_reason TEXT,
    category TEXT,
    analysis TEXT,
    raw_chat TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

function ensureLeadSchema() {
  const columns = db.prepare('PRAGMA table_info(leads)').all() as Array<{ name: string }>;
  const existing = new Set(columns.map((column) => column.name));
  const requiredColumns: Array<[string, string]> = [
    ['intent', 'TEXT'],
    ['audience_type', 'TEXT'],
    ['market', 'TEXT'],
    ['goals', 'TEXT'],
    ['current_setup', 'TEXT'],
    ['pain_point', 'TEXT'],
    ['demo_interest', 'TEXT'],
    ['contact_preference', 'TEXT'],
    ['best_time', 'TEXT'],
    ['analysis', 'TEXT'],
    ['score_reason', 'TEXT'],
  ];

  for (const [name, type] of requiredColumns) {
    if (!existing.has(name)) {
      db.exec(`ALTER TABLE leads ADD COLUMN ${name} ${type}`);
    }
  }
}

ensureLeadSchema();

function getContactEmail() {
  return process.env.NOTIFICATION_EMAIL_TO || DEFAULT_CONTACT_EMAIL;
}

function getEmailProvider(): EmailProvider {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return 'gmail';
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return 'smtp';
  }

  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
    return 'resend';
  }

  return 'none';
}

function getEmailDebugInfo(error?: string): EmailDebugInfo {
  return {
    provider: getEmailProvider(),
    configured: getEmailProvider() !== 'none',
    contactEmail: getContactEmail(),
    gmail: {
      hasUser: Boolean(process.env.GMAIL_USER),
      hasAppPassword: Boolean(process.env.GMAIL_APP_PASSWORD),
    },
    resend: {
      hasApiKey: Boolean(process.env.RESEND_API_KEY),
      hasEmailFrom: Boolean(process.env.EMAIL_FROM),
    },
    smtp: {
      hasHost: Boolean(process.env.SMTP_HOST),
      hasUser: Boolean(process.env.SMTP_USER),
      hasPass: Boolean(process.env.SMTP_PASS),
      hasFrom: Boolean(process.env.SMTP_FROM),
    },
    ...(error ? { error } : {}),
  };
}

function createMailerNotifier(): LeadNotifier | null {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    return {
      provider: 'gmail',
      async sendLeadEmail({ payload, subject, htmlBody, textBody }) {
        await transporter.sendMail({
          from: `"SubNest AI" <${process.env.GMAIL_USER}>`,
          to: getContactEmail(),
          replyTo: payload.email || undefined,
          subject,
          html: htmlBody,
          text: textBody,
        });
      },
    };
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = Number(process.env.SMTP_PORT || '587');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    return {
      provider: 'smtp',
      async sendLeadEmail({ payload, subject, htmlBody, textBody }) {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: getContactEmail(),
          replyTo: payload.email || undefined,
          subject,
          html: htmlBody,
          text: textBody,
        });
      },
    };
  }

  return null;
}

function createResendNotifier(): LeadNotifier | null {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return null;
  }

  return {
    provider: 'resend',
    async sendLeadEmail({ payload, subject, htmlBody, textBody }) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM,
          to: [getContactEmail()],
          reply_to: payload.email || undefined,
          subject,
          html: htmlBody,
          text: textBody,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Resend API error (${response.status}): ${errorBody}`);
      }
    },
  };
}

function createLeadNotifier(): LeadNotifier | null {
  return createMailerNotifier() || createResendNotifier();
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeValue(value: string) {
  return value.trim() || 'Not specified';
}

function buildEmailHtml(payload: LeadEmailPayload) {
  const rows: Array<[string, string, boolean]> = [
    ['Name', payload.leadName, true],
    ['Phone', payload.phone || 'Not provided', false],
    ['Email', payload.email || 'Not provided', true],
    ['Intent', safeValue(payload.intent), false],
    ['Audience Type', safeValue(payload.audienceType), true],
    ['Market', safeValue(payload.market), false],
    ['Goals', safeValue(payload.goals), true],
    ['Timeline', safeValue(payload.timeline), false],
    ['Current Setup', safeValue(payload.currentSetup), true],
    ['Pain Point', safeValue(payload.painPoint), false],
    ['Demo Interest', safeValue(payload.demoInterest), true],
    ['Contact Preference', safeValue(payload.contactPreference), false],
    ['Best Time to Contact', safeValue(payload.bestTime), true],
    ['Lead Score', `${payload.score || 0}/10`, false],
    ['Score Reason', safeValue(payload.scoreReason), true],
    ['Lead Category', safeValue(payload.category), true],
  ];

  const tableRows = rows
    .map(
      ([label, value, shaded]) => `
        <tr${shaded ? ' style="background: #fef2f2;"' : ''}>
          <td style="padding: 10px; font-weight: bold; border: 1px solid #fecaca;">${escapeHtml(label)}</td>
          <td style="padding: 10px; border: 1px solid #fecaca;">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #7f1d1d; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">New SubNest Lead</h2>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        ${tableRows}
      </table>

      <h3 style="color: #7f1d1d; margin-top: 30px;">Chat Analysis</h3>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">
${escapeHtml(payload.analysis || 'No analysis available')}
      </div>

      <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; text-align: center;">Sent by SubNest AI Assistant</p>
    </div>
  `;
}

function buildEmailText(payload: LeadEmailPayload) {
  return [
    'New SubNest Lead',
    '',
    `Name: ${payload.leadName}`,
    `Phone: ${payload.phone || 'Not provided'}`,
    `Email: ${payload.email || 'Not provided'}`,
    `Intent: ${safeValue(payload.intent)}`,
    `Audience Type: ${safeValue(payload.audienceType)}`,
    `Market: ${safeValue(payload.market)}`,
    `Goals: ${safeValue(payload.goals)}`,
    `Timeline: ${safeValue(payload.timeline)}`,
    `Current Setup: ${safeValue(payload.currentSetup)}`,
    `Pain Point: ${safeValue(payload.painPoint)}`,
    `Demo Interest: ${safeValue(payload.demoInterest)}`,
    `Contact Preference: ${safeValue(payload.contactPreference)}`,
    `Best Time to Contact: ${safeValue(payload.bestTime)}`,
    `Lead Score: ${payload.score || 0}/10`,
    `Score Reason: ${safeValue(payload.scoreReason)}`,
    `Lead Category: ${safeValue(payload.category)}`,
    '',
    'Chat Analysis',
    payload.analysis || 'No analysis available',
  ].join('\n');
}

function buildRequirements(payload: LeadEmailPayload) {
  return [
    payload.audienceType ? `Audience: ${payload.audienceType}` : '',
    payload.market ? `Market: ${payload.market}` : '',
    payload.goals ? `Goals: ${payload.goals}` : '',
    payload.painPoint ? `Pain Point: ${payload.painPoint}` : '',
    payload.currentSetup ? `Current Setup: ${payload.currentSetup}` : '',
    payload.demoInterest ? `Demo Interest: ${payload.demoInterest}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function normalizeLeadPayload(
  body: Partial<LeadEmailPayload> & { name?: string; raw_chat?: unknown[] },
): LeadEmailPayload {
  return {
    leadName: body.leadName?.trim() || body.name?.trim() || 'Unknown lead',
    phone: body.phone?.trim() || '',
    email: body.email?.trim() || '',
    intent: body.intent?.trim() || '',
    audienceType: body.audienceType?.trim() || '',
    market: body.market?.trim() || '',
    goals: body.goals?.trim() || '',
    timeline: body.timeline?.trim() || '',
    currentSetup: body.currentSetup?.trim() || '',
    painPoint: body.painPoint?.trim() || '',
    demoInterest: body.demoInterest?.trim() || '',
    contactPreference: body.contactPreference?.trim() || '',
    bestTime: body.bestTime?.trim() || '',
    score: Number.isFinite(Number(body.score)) ? Number(body.score) : 0,
    scoreReason: body.scoreReason?.trim() || '',
    category: body.category?.trim() || 'Cold',
    analysis: body.analysis?.trim() || '',
    rawChat: Array.isArray(body.rawChat) ? body.rawChat : Array.isArray(body.raw_chat) ? body.raw_chat : [],
  };
}

function saveLead(payload: LeadEmailPayload) {
  const statement = db.prepare(`
    INSERT INTO leads (
      name,
      email,
      phone,
      intent,
      audience_type,
      market,
      goals,
      timeline,
      current_setup,
      pain_point,
      demo_interest,
      contact_preference,
      best_time,
      requirements,
      score,
      score_reason,
      category,
      analysis,
      raw_chat
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  return statement.run(
    payload.leadName,
    payload.email || null,
    payload.phone || null,
    payload.intent || null,
    payload.audienceType || null,
    payload.market || null,
    payload.goals || null,
    payload.timeline || null,
    payload.currentSetup || null,
    payload.painPoint || null,
    payload.demoInterest || null,
    payload.contactPreference || null,
    payload.bestTime || null,
    buildRequirements(payload) || null,
    payload.score,
    payload.scoreReason || null,
    payload.category || null,
    payload.analysis || null,
    JSON.stringify(payload.rawChat || []),
  );
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post('/api/send-email', async (req, res) => {
    const payload = normalizeLeadPayload(req.body);
    const subject = typeof req.body?.subject === 'string' && req.body.subject.trim()
      ? req.body.subject.trim()
      : `New SubNest Lead: ${payload.leadName}`;
    const htmlBody = typeof req.body?.htmlContent === 'string' && req.body.htmlContent.trim()
      ? req.body.htmlContent
      : buildEmailHtml(payload);
    const textBody = typeof req.body?.textContent === 'string' && req.body.textContent.trim()
      ? req.body.textContent
      : buildEmailText(payload);

    if (!payload.leadName || (!payload.phone && !payload.email)) {
      res.status(400).json({ error: 'Missing required fields: leadName and either phone or email' });
      return;
    }

    let leadId: number | bigint | undefined;

    try {
      const saved = saveLead(payload);
      leadId = saved.lastInsertRowid;
    } catch (error) {
      console.error('Database error while saving lead:', error);
      res.status(500).json({ error: 'Failed to save lead' });
      return;
    }

    const notifier = createLeadNotifier();

    if (!notifier) {
      const debugInfo = getEmailDebugInfo('No email provider is fully configured.');
      console.warn('Lead saved, but email delivery is not configured.', debugInfo);
      res.status(202).json({ success: true, id: leadId, emailed: false, emailDebug: debugInfo });
      return;
    }

    try {
      await notifier.sendLeadEmail({ payload, subject, htmlBody, textBody });
      res.json({ success: true, id: leadId, emailed: true, emailDebug: getEmailDebugInfo() });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown email delivery error';
      console.error('Email send error:', error);
      res.status(500).json({
        error: 'Failed to send email',
        id: leadId,
        emailed: false,
        emailDebug: getEmailDebugInfo(errorMessage),
      });
    }
  });

  app.post('/api/leads', (req, res) => {
    try {
      const payload = normalizeLeadPayload(req.body);
      const saved = saveLead(payload);
      res.json({ success: true, id: saved.lastInsertRowid });
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Failed to save lead' });
    }
  });

  app.get('/api/leads', (req, res) => {
    try {
      const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
      res.json(leads);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Failed to fetch leads' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Email delivery status:', getEmailDebugInfo());
  });
}

startServer();
