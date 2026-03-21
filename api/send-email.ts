const DEFAULT_CONTACT_EMAIL = 'info@subnest.ai';

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

type RequestBody = Partial<LeadEmailPayload> & {
  name?: string;
  raw_chat?: unknown[];
  subject?: string;
  htmlContent?: string;
  textContent?: string;
};

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

function normalizeLeadPayload(body: RequestBody): LeadEmailPayload {
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

async function sendViaResend(payload: LeadEmailPayload, subject: string, htmlBody: string, textBody: string) {
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
}

async function sendViaSmtp(payload: LeadEmailPayload, subject: string, htmlBody: string, textBody: string) {
  const nodemailer = await import('nodemailer');

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    const transporter = nodemailer.default.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"SubNest AI" <${process.env.GMAIL_USER}>`,
      to: getContactEmail(),
      replyTo: payload.email || undefined,
      subject,
      html: htmlBody,
      text: textBody,
    });
    return;
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = Number(process.env.SMTP_PORT || '587');
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: getContactEmail(),
      replyTo: payload.email || undefined,
      subject,
      html: htmlBody,
      text: textBody,
    });
    return;
  }

  throw new Error('No SMTP transport is configured.');
}

async function sendLeadEmail(payload: LeadEmailPayload, subject: string, htmlBody: string, textBody: string) {
  const provider = getEmailProvider();

  if (provider === 'resend') {
    await sendViaResend(payload, subject, htmlBody, textBody);
    return;
  }

  if (provider === 'gmail' || provider === 'smtp') {
    await sendViaSmtp(payload, subject, htmlBody, textBody);
    return;
  }

  throw new Error('No email provider is fully configured.');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const payload = normalizeLeadPayload((req.body || {}) as RequestBody);
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

  if (getEmailProvider() === 'none') {
    const debugInfo = getEmailDebugInfo('No email provider is fully configured.');
    res.status(202).json({ success: true, emailed: false, emailDebug: debugInfo });
    return;
  }

  try {
    await sendLeadEmail(payload, subject, htmlBody, textBody);
    res.status(200).json({ success: true, emailed: true, emailDebug: getEmailDebugInfo() });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown email delivery error';
    res.status(500).json({
      error: 'Failed to send email',
      emailed: false,
      emailDebug: getEmailDebugInfo(errorMessage),
    });
  }
}
