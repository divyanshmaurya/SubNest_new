import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Mic, RotateCcw } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import { CONTACT_EMAIL, DEMO_SITES, DEMO_URL } from '../lib/siteConfig';

type ChatRole = 'user' | 'model';
type ChatMode = 'text' | 'voice';
type Stage =
  | 'intent'
  | 'core_needs'
  | 'core_needs_timeline'
  | 'intent_specific'
  | 'value_exchange'
  | 'lead_name'
  | 'lead_phone'
  | 'lead_email'
  | 'handoff'
  | 'complete';

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  timestamp: Date;
}

interface SessionData {
  stage: Stage;
  intent?: string;
  audienceType?: string;
  market?: string;
  goals?: string;
  timeline?: string;
  currentSetup?: string;
  painPoint?: string;
  demoInterest?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  contactPreference?: string;
  bestTime?: string;
}

interface LeadAnalysis {
  score: number;
  scoreReason: string;
  analysis: string;
}

interface EmailAttemptResult {
  emailed: boolean;
  debugMessage?: string;
}

interface StructuredChatResponse {
  message: string;
  extractedData?: Partial<Omit<SessionData, 'stage'>>;
  nextStage?: Stage;
}

const CHAT_MODEL = 'gemini-2.5-flash';
const VOICE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';
const MAX_HISTORY_MESSAGES = 8;
const PRODUCT_CONTEXT_CHAR_LIMIT = 900;
const INITIAL_SESSION: SessionData = { stage: 'intent' };
const WELCOME =
  "Hi! I'm SubNest AI. I can explain how the website works, show where it fits, and help you decide if it's a fit for your real estate business. Are you looking to use SubNest for your own team, or just exploring how it works?";
const FALLBACK_INTRODUCTION =
  'SubNest is a 24/7 AI assistant and dedicated real estate website where brokers, landlords, and sellers can publish listings, while buyers and renters can discover properties and chat directly with the AI.';
const CHAT_FAILURE_MESSAGE =
  'SubNest AI could not get a response right now. Please check the Gemini API key or browser console, then try again.';
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const URL_PATTERN = /(https?:\/\/[^\s)]+)/g;

/** Split concatenated URLs that have no whitespace between them (e.g. "https://a.comhttps://b.com") */
function splitConcatenatedUrls(text: string): string {
  return text.replace(/(https?:\/\/[^\s)]+?)(https?:\/\/)/g, '$1\n$2');
}
const DEMO_SITE_LABELS = new Map<string, string>([
  [DEMO_URL, 'book a meeting'],
  ...DEMO_SITES.map((site) => [site.url, site.name.toLowerCase()] as [string, string]),
]);
const SESSION_DATA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    intent: { type: Type.STRING },
    audienceType: { type: Type.STRING },
    market: { type: Type.STRING },
    goals: { type: Type.STRING },
    timeline: { type: Type.STRING },
    currentSetup: { type: Type.STRING },
    painPoint: { type: Type.STRING },
    demoInterest: { type: Type.STRING },
    firstName: { type: Type.STRING },
    lastName: { type: Type.STRING },
    phone: { type: Type.STRING },
    email: { type: Type.STRING },
    contactPreference: { type: Type.STRING },
    bestTime: { type: Type.STRING },
  },
} as const;
const CHAT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    message: { type: Type.STRING },
    extractedData: SESSION_DATA_SCHEMA,
    nextStage: { type: Type.STRING },
  },
  required: ['message', 'nextStage'],
} as const;
const TIMELINE_SIGNAL_PATTERN = /(asap|immediately|this week|this month|next week|next month|within \d+ (day|days|week|weeks|month|months)|soon|ready now)/i;
const INTEREST_SIGNAL_PATTERN = /(demo|pricing|setup|launch|onboard|partner|follow up|follow-up|book|meeting)/i;
const EXPLORATION_PATTERN = /(exploring|just looking|researching|curious)/i;

function createMessage(role: ChatRole, text: string): ChatMessage {
  return {
    id: Math.random().toString(36).slice(2, 11),
    role,
    text,
    timestamp: new Date(),
  };
}

function pcmEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.byteLength; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
}

function pcmDecode(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function toAudioBuffer(data: Uint8Array, ctx: AudioContext, sampleRate: number): Promise<AudioBuffer> {
  const int16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, int16.length, sampleRate);
  const channel = buffer.getChannelData(0);

  for (let index = 0; index < int16.length; index += 1) {
    channel[index] = int16[index] / 32768;
  }

  return buffer;
}

function escapeHtml(value?: string) {
  return (value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeDisplay(value?: string) {
  return value?.trim() || '—';
}

function getLeadCategory(score: number) {
  return score >= 7 ? 'Hot' : score >= 4 ? 'Warm' : 'Cold';
}

function getLeadName(session: SessionData) {
  return `${session.firstName || ''} ${session.lastName || ''}`.trim() || 'Unknown';
}

function buildLeadSubject(session: SessionData, result: LeadAnalysis) {
  const scoreLabel = result.score >= 7 ? 'HOT' : result.score >= 4 ? 'WARM' : 'COLD';
  const subjectParts = [
    `New Lead: ${getLeadName(session)}`,
    session.intent || '',
    session.market || '',
    `Call ${session.bestTime || 'TBD'}`,
  ].filter(Boolean);

  return `[${scoreLabel} ${result.score}/10] ${subjectParts.join(' – ')}`;
}

function buildEmailHtml(session: SessionData, result: LeadAnalysis, chatHistory: ChatMessage[]) {
  const scoreColor = result.score >= 7 ? '#16a34a' : result.score >= 4 ? '#d97706' : '#dc2626';
  const scoreBg = result.score >= 7 ? '#dcfce7' : result.score >= 4 ? '#fef3c7' : '#fee2e2';
  const scoreLabel = result.score >= 7 ? 'HOT LEAD' : result.score >= 4 ? 'WARM LEAD' : 'COLD LEAD';
  const filledDots = '●'.repeat(result.score);
  const emptyDots = '○'.repeat(10 - result.score);
  const transcript = chatHistory
    .map((message) => `<tr>
      <td style="padding:5px 8px;font-weight:bold;color:${message.role === 'user' ? '#2563eb' : '#374151'};white-space:nowrap;vertical-align:top">${message.role === 'user' ? 'Customer' : 'AI'}</td>
      <td style="padding:5px 8px">${escapeHtml(message.text)}</td>
    </tr>`)
    .join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>New SubNest Lead</title></head>
<body style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;color:#1f2937">
  <div style="background:#0f172a;color:white;padding:24px 28px;border-radius:10px 10px 0 0">
    <h1 style="margin:0;font-size:22px;font-weight:700">New SubNest Lead</h1>
    <p style="margin:4px 0 0;opacity:.6;font-size:13px">SubNest AI · Demo Intake Report · ${new Date().toLocaleString()}</p>
  </div>

  <div style="background:${scoreBg};border:2px solid ${scoreColor};padding:20px 28px;display:flex;align-items:center;gap:20px">
    <div style="text-align:center;min-width:80px">
      <div style="font-size:42px;font-weight:900;color:${scoreColor};line-height:1">${result.score}</div>
      <div style="font-size:10px;color:${scoreColor};font-weight:700;letter-spacing:.1em">&nbsp;OUT OF 10</div>
    </div>
    <div style="border-left:2px solid ${scoreColor};padding-left:20px;flex:1">
      <div style="font-size:13px;font-weight:800;color:${scoreColor};letter-spacing:.12em;margin-bottom:6px">${scoreLabel}</div>
      <div style="font-size:18px;letter-spacing:2px;color:${scoreColor};margin-bottom:8px">${filledDots}<span style="color:#d1d5db">${emptyDots}</span></div>
      <p style="margin:0;font-size:13px;color:#374151;line-height:1.5">${escapeHtml(result.scoreReason)}</p>
    </div>
  </div>

  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:0;padding:20px 28px">
    <h2 style="color:#0f172a;font-size:15px;font-weight:700;margin:0 0 14px;text-transform:uppercase;letter-spacing:.05em">Contact Details</h2>
    <table style="width:100%;border-collapse:collapse">
      <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b;width:160px;font-size:13px">Full Name</td><td style="padding:8px 0;font-weight:700;font-size:14px">${escapeHtml(getLeadName(session))}</td></tr>
      <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b;font-size:13px">Phone</td><td style="padding:8px 0;font-weight:700;font-size:14px;color:#0f172a">${escapeHtml(safeDisplay(session.phone))}</td></tr>
      <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b;font-size:13px">Email</td><td style="padding:8px 0;font-size:14px">${escapeHtml(safeDisplay(session.email))}</td></tr>
      <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b;font-size:13px">Preferred Contact</td><td style="padding:8px 0;font-size:14px">${escapeHtml(safeDisplay(session.contactPreference))}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Best Time to Reach</td><td style="padding:8px 0;font-weight:700;font-size:14px;color:#16a34a">${escapeHtml(safeDisplay(session.bestTime))}</td></tr>
    </table>
  </div>

  <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;padding:20px 28px">
    <h2 style="color:#0f172a;font-size:15px;font-weight:700;margin:0 0 14px;text-transform:uppercase;letter-spacing:.05em">Business Fit Summary</h2>
    <table style="width:100%;border-collapse:collapse">
      <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b;width:160px;font-size:13px">Intent</td><td style="padding:8px 0"><span style="background:#dbeafe;color:#1d4ed8;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700">${escapeHtml(safeDisplay(session.intent))}</span></td></tr>
      <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b;font-size:13px">Audience Type</td><td style="padding:8px 0;font-size:14px">${escapeHtml(safeDisplay(session.audienceType))}</td></tr>
      <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b;font-size:13px">Market</td><td style="padding:8px 0;font-size:14px">${escapeHtml(safeDisplay(session.market))}</td></tr>
      <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b;font-size:13px">Goals</td><td style="padding:8px 0;font-size:14px">${escapeHtml(safeDisplay(session.goals))}</td></tr>
      <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b;font-size:13px">Timeline</td><td style="padding:8px 0;font-size:14px">${escapeHtml(safeDisplay(session.timeline))}</td></tr>
      <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b;font-size:13px">Current Setup</td><td style="padding:8px 0;font-size:14px">${escapeHtml(safeDisplay(session.currentSetup))}</td></tr>
      <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b;font-size:13px">Pain Point</td><td style="padding:8px 0;font-size:14px">${escapeHtml(safeDisplay(session.painPoint))}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Demo Interest</td><td style="padding:8px 0;font-size:14px">${escapeHtml(safeDisplay(session.demoInterest))}</td></tr>
    </table>
  </div>

  <div style="background:#fffbeb;border:1px solid #fcd34d;border-top:0;padding:20px 28px">
    <h2 style="color:#92400e;font-size:15px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:.05em">AI Lead Analysis</h2>
    <p style="margin:0;line-height:1.75;font-size:14px;color:#1f2937;white-space:pre-wrap">${escapeHtml(result.analysis)}</p>
  </div>

  <div style="background:#fff;border:1px solid #e2e8f0;border-top:0;padding:20px 28px">
    <h2 style="color:#0f172a;font-size:15px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:.05em">Full Chat Transcript</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      ${transcript}
    </table>
  </div>

  <div style="background:#0f172a;color:#64748b;padding:14px 28px;border-radius:0 0 10px 10px;font-size:11px;text-align:center">
    SubNest AI · ${escapeHtml(CONTACT_EMAIL)}
  </div>
</body>
</html>`;
}

function formatEmailDebug(payload: any, status: number) {
  const details = [`status=${status}`];

  if (payload?.error) {
    details.push(`error=${payload.error}`);
  }

  const debug = payload?.emailDebug;
  if (debug) {
    details.push(`provider=${debug.provider ?? 'unknown'}`);
    details.push(`configured=${String(debug.configured ?? false)}`);

    if (debug.error) {
      details.push(`detail=${debug.error}`);
    }

    if (debug.gmail) {
      details.push(`gmailUser=${String(Boolean(debug.gmail.hasUser))}`);
      details.push(`gmailAppPassword=${String(Boolean(debug.gmail.hasAppPassword))}`);
    }

    if (debug.smtp) {
      details.push(`smtpHost=${String(Boolean(debug.smtp.hasHost))}`);
      details.push(`smtpUser=${String(Boolean(debug.smtp.hasUser))}`);
      details.push(`smtpPass=${String(Boolean(debug.smtp.hasPass))}`);
      details.push(`smtpFrom=${String(Boolean(debug.smtp.hasFrom))}`);
    }

    if (debug.resend) {
      details.push(`resendKey=${String(Boolean(debug.resend.hasApiKey))}`);
      details.push(`resendFrom=${String(Boolean(debug.resend.hasEmailFrom))}`);
    }
  }

  return details.join(' | ');
}

function renderMessageText(text: string) {
  const lines = splitConcatenatedUrls(text).split('\n');

  const renderLine = (line: string) => {
    const nodes: React.ReactNode[] = [];
    let currentIndex = 0;

    for (const match of line.matchAll(MARKDOWN_LINK_PATTERN)) {
      const fullMatch = match[0];
      const label = match[1];
      const url = match[2];
      const start = match.index ?? 0;

      if (start > currentIndex) {
        nodes.push(line.slice(currentIndex, start));
      }

      nodes.push(
        <a
          key={`${url}-${start}`}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-brand-blue underline underline-offset-2"
        >
          {label}
        </a>,
      );

      currentIndex = start + fullMatch.length;
    }

    if (currentIndex === 0) {
      let urlIndex = 0;
      return line.split(URL_PATTERN).map((segment) => {
        if (!segment.match(/^https?:\/\//)) {
          return <React.Fragment key={`text-${urlIndex += 1}`}>{segment}</React.Fragment>;
        }

        const label = DEMO_SITE_LABELS.get(segment) || segment;
        return (
          <a
            key={`url-${urlIndex += 1}`}
            href={segment}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-brand-blue underline underline-offset-2"
          >
            {label}
          </a>
        );
      });
    }

    if (currentIndex < line.length) {
      nodes.push(line.slice(currentIndex));
    }

    return nodes;
  };

  return lines.map((line, lineIndex) => (
    <React.Fragment key={`${line}-${lineIndex}`}>
      {renderLine(line)}
      {lineIndex < lines.length - 1 && <br />}
    </React.Fragment>
  ));
}

function serializeMessages(messages: ChatMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    text: message.text,
    timestamp: message.timestamp.toISOString(),
  }));
}

function buildCompactProductContext(productIntroduction: string) {
  const lines = productIntroduction
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const prioritizedLines = lines.filter((line) =>
    /subnest is|publish|buyers|renters|ai assistant|lead qualification|multilingual|free setup|demo link|website demos|24\/7|website/i.test(
      line,
    ),
  );

  const compact = (prioritizedLines.length > 0 ? prioritizedLines : lines)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return compact.length > PRODUCT_CONTEXT_CHAR_LIMIT
    ? `${compact.slice(0, PRODUCT_CONTEXT_CHAR_LIMIT - 3)}...`
    : compact;
}

function mergeSessionData(
  current: SessionData,
  extractedData?: Partial<Omit<SessionData, 'stage'>>,
  nextStage?: Stage,
): SessionData {
  const updated: SessionData = { ...current };

  if (extractedData) {
    for (const [key, value] of Object.entries(extractedData) as Array<
      [keyof Omit<SessionData, 'stage'>, SessionData[keyof Omit<SessionData, 'stage'>]]
    >) {
      if (typeof value === 'string' && value.trim()) {
        updated[key] = value.trim();
      }
    }
  }

  if (nextStage) {
    updated.stage = nextStage;
  }

  return updated;
}

function shouldNotifyLead(previous: SessionData, updated: SessionData) {
  if (!updated.phone && !updated.email) return false;

  // Trigger when bestTime is newly captured.
  if (!previous.bestTime && Boolean(updated.bestTime)) return true;

  // Also trigger when the stage reaches handoff or complete, even if
  // the model didn't extract bestTime as a structured field.
  const preHandoff = previous.stage !== 'handoff' && previous.stage !== 'complete';
  const nowHandoff = updated.stage === 'handoff' || updated.stage === 'complete';
  if (preHandoff && nowHandoff) return true;

  return false;
}

function buildLeadAnalysis(messages: ChatMessage[], session: SessionData): LeadAnalysis {
  let score = 2;
  const userMessageCount = messages.filter((message) => message.role === 'user').length;
  const combinedSignals = [session.goals, session.painPoint, session.demoInterest, session.intent]
    .filter(Boolean)
    .join(' ');

  if (session.phone) score += 2;
  if (session.email) score += 1;
  if (session.phone && session.email) score += 1;
  if (session.contactPreference) score += 1;
  if (session.bestTime) score += 1;
  if (session.timeline && TIMELINE_SIGNAL_PATTERN.test(session.timeline)) score += 1;
  if (session.currentSetup) score += 1;
  if (INTEREST_SIGNAL_PATTERN.test(combinedSignals)) score += 1;
  if (EXPLORATION_PATTERN.test(combinedSignals)) score -= 1;
  if (userMessageCount >= 6) score += 1;

  score = Math.max(1, Math.min(10, score));

  const engagement = userMessageCount >= 6 ? 'High' : userMessageCount >= 4 ? 'Medium' : 'Low';
  const category = getLeadCategory(score);
  const scoreReason = `${category} lead based on captured contact details, ${engagement.toLowerCase()} engagement, and ${session.bestTime ? 'a confirmed follow-up time' : 'incomplete follow-up timing'}.`;

  return {
    score,
    scoreReason,
    analysis: [
      `${category} lead for SubNest with ${engagement.toLowerCase()} engagement.`,
      `Business type: ${session.audienceType || session.intent || 'Not specified'}.`,
      `Market: ${session.market || 'Not specified'}.`,
      `Goals: ${session.goals || 'Not specified'}.`,
      `Pain point: ${session.painPoint || 'Not specified'}.`,
      `Timeline: ${session.timeline || 'Not specified'}.`,
      `Current setup: ${session.currentSetup || 'Not specified'}.`,
      `Demo interest: ${session.demoInterest || 'Not specified'}.`,
      `Preferred contact: ${session.contactPreference || 'Not specified'} at ${session.bestTime || 'Not specified'}.`,
      `Recommended action: follow up with a focused demo tied to ${session.goals || 'their stated goals'} and address ${session.painPoint || 'their current workflow gaps'}.`,
    ].join(' '),
  };
}

function systemPrompt(session: SessionData, productContext: string) {
  const demoLinksBlock = DEMO_SITES.map((site) => `${site.name}: ${site.url}`).join('\n');

  return `You are a friendly, warm female AI assistant for SubNest. Talk like a real person - short, casual, natural sentences. You are helping visitors understand the SubNest website and qualify interested real estate professionals. Always use she/her pronouns when referring to yourself.

RULES:
- NEVER use markdown bullets or headings.
- NEVER reveal internal reasoning, plans, or what you are about to do.
- NEVER say things like "I've registered", "switching stages", or "my assessment".
- If the user asks a direct question, answer it briefly first, then ask the next relevant question.
- Only use the product information below as the source of truth. Do not invent pricing, integrations, or promises that are not supported there.
- CRITICAL: Each URL MUST be on its own separate line with a newline character before it. NEVER place two URLs on the same line or adjacent without a newline between them. Correct format:\nHere are the links:\nhttps://first-link.com\nhttps://second-link.com
- 1-3 short sentences max. Sound human, not robotic.

STAGE: ${session.stage}
DATA: ${JSON.stringify(session)}
PRODUCT_CONTEXT:
${productContext}
CONTACT_EMAIL: ${CONTACT_EMAIL}
BOOKING_LINK: ${DEMO_URL}
DEMO_LINKS:
${demoLinksBlock}

WHAT TO SAY (only for current stage):

intent -> Figure out who they are and what they want from SubNest. If they ask what SubNest is, explain it briefly using PRODUCT_INFO, then ask whether they want SubNest for their own brokerage, landlord, or sales business, or if they are just exploring.
core_needs -> They shared who they are. Acknowledge, then ask: "What kind of listings or clients are you focused on, and what's the main thing you'd want SubNest to help with?"
core_needs_timeline -> Acknowledge their goals briefly, then ask: "And what's your timeline for getting something like this live?"
intent_specific -> Acknowledge their timeline briefly, then ask: "Are you replacing an existing website or lead workflow, or would this be a fresh setup?"
value_exchange -> Only use this stage once the user sounds genuinely interested in a demo, pricing, setup, or follow-up. Mention the two demo sites naturally, then ask: "Can I get your name so our team can follow up with the right walkthrough?"
lead_name -> Got name. "Thanks, [Name]! What's your cell phone number?"
lead_phone -> Got number? "Got it! And what's your email address?" Refused? "No problem - I do need at least one reliable way for our team to follow up. Would you rather share your email?"
lead_email -> Got or skipped email. "Last thing - would you prefer our team to reach out by text, call, or email? And what time works best?"
handoff -> Got preference and time. "Perfect, [Name]! We'll reach out by [text/call/email] around [time]. You can also check the live demos or book a meeting here." Then output each URL on its own line separated by \\n. Never concatenate URLs together.
complete -> Chat naturally about SubNest, setup, demos, pricing questions, and next steps.

IMPORTANT:
- Your message must ONLY contain the question or action described for the CURRENT stage. Do NOT ask the next stage's question in advance. For example, if you are at core_needs and the user shares their goals, acknowledge briefly and set nextStage to core_needs_timeline - but do NOT ask about timeline yet. The next call will handle that.
- Do not advance to value_exchange or later stages unless the user is clearly interested in using SubNest or wants follow-up.
- If the user is still just asking general questions, answer them and keep next_stage at the current stage.

Transitions: intent -> core_needs -> core_needs_timeline -> intent_specific -> value_exchange -> lead_name -> lead_phone -> lead_email -> handoff -> complete
Keys: intent, audienceType, market, goals, timeline, currentSetup, painPoint, demoInterest, firstName, lastName, phone, email, contactPreference, bestTime
Return JSON only with:
- message: what you say to the user
- extractedData: any newly captured fields
- nextStage: the next stage
Keep nextStage = current stage if extraction is incomplete or the user is not yet clearly interested.`;
}

function voiceSystemPrompt(session: SessionData, productContext: string) {
  const demoLinksBlock = DEMO_SITES.map((site) => `${site.name}: ${site.url}`).join('\n');

  return `You are a friendly female SubNest assistant on a voice call. Talk like a real person - casual, warm, short sentences. Always use she/her pronouns when referring to yourself.

RULES:
- NEVER describe what you are doing internally.
- NEVER use markdown.
- NEVER narrate your thought process.
- Just say what you would actually say out loud to a person on the phone.
- 1-3 short, natural sentences only.
- Use this product context as your source of truth: ${productContext}

STAGE: ${session.stage}
DATA: ${JSON.stringify(session)}
CONTACT_EMAIL: ${CONTACT_EMAIL}
BOOKING_LINK: ${DEMO_URL}
DEMO_LINKS:
${demoLinksBlock}

WHAT TO SAY (current stage only):
intent -> Learn who they are and what they want from SubNest. Briefly explain SubNest if asked, then ask whether they want it for their own business or are just exploring.
core_needs -> Ask what kind of listings or clients they focus on, and what they want SubNest to help with.
core_needs_timeline -> Ask what their timeline is for getting something like this live.
intent_specific -> Ask whether they are replacing an existing website or lead workflow, or starting fresh.
value_exchange -> Mention that live demos are available and ask for their name.
lead_name -> Ask for their cell phone number.
lead_phone -> Ask for their email address, or ask for one reliable contact method if they hesitate.
lead_email -> Ask whether they prefer text, call, or email, and what time works best.
handoff -> Confirm the follow-up and mention that live demos and booking are available.
complete -> Chat naturally about SubNest and next steps.

IMPORTANT:
- Your response must ONLY address the CURRENT stage. Do NOT ask the next stage's question in advance. Acknowledge the user's answer briefly, then stop. The next stage's question will be handled in the next turn.
- Whenever you capture or confirm a lead field or stage change, call the updateLeadInfo tool.
- Use the tool for new or corrected values only.
- Do not ask for information already captured unless the user is correcting it.`;
}

async function sendEmail(
  session: SessionData,
  result: LeadAnalysis,
  messages: ChatMessage[],
): Promise<EmailAttemptResult> {
  try {
    const subject = buildLeadSubject(session, result);
    const htmlContent = buildEmailHtml(session, result, messages);

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject,
        htmlContent,
        leadName: getLeadName(session),
        phone: session.phone || '',
        email: session.email || '',
        intent: session.intent || '',
        audienceType: session.audienceType || '',
        market: session.market || '',
        goals: session.goals || '',
        timeline: session.timeline || '',
        currentSetup: session.currentSetup || '',
        painPoint: session.painPoint || '',
        demoInterest: session.demoInterest || '',
        contactPreference: session.contactPreference || '',
        bestTime: session.bestTime || '',
        score: result.score,
        scoreReason: result.scoreReason,
        category: getLeadCategory(result.score),
        analysis: result.analysis,
        rawChat: serializeMessages(messages),
      }),
    });

    const payload = await response.json().catch(() => null);
    if (response.ok && Boolean(payload?.emailed ?? true)) {
      return { emailed: true };
    }

    return {
      emailed: false,
      debugMessage: formatEmailDebug(payload, response.status),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown network error';
    return {
      emailed: false,
      debugMessage: `request_failed=${message}`,
    };
  }
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>('text');
  const [messages, setMessages] = useState<ChatMessage[]>([createMessage('model', WELCOME)]);
  const [inputText, setInputText] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isModelTyping, setIsModelTyping] = useState(false);
  const [session, setSession] = useState<SessionData>(INITIAL_SESSION);
  const [emailSent, setEmailSent] = useState(false);
  const [productContext, setProductContext] = useState(buildCompactProductContext(FALLBACK_INTRODUCTION));

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  const sessionDataRef = useRef(session);
  const emailSentRef = useRef(emailSent);
  const productContextRef = useRef(productContext);
  const sessionRef = useRef<any>(null);
  const inputAudioCtx = useRef<AudioContext | null>(null);
  const outputAudioCtx = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextPlayTime = useRef(0);
  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');
  const pendingLeadSessionRef = useRef<SessionData | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    sessionDataRef.current = session;
  }, [session]);

  useEffect(() => {
    emailSentRef.current = emailSent;
  }, [emailSent]);

  useEffect(() => {
    productContextRef.current = productContext;
  }, [productContext]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, mode]);

  useEffect(() => {
    let isMounted = true;

    fetch('/chatbot-product-introduction.txt')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load product introduction: ${response.status}`);
        }
        return response.text();
      })
      .then((text) => {
        if (isMounted && text.trim()) {
          setProductContext(buildCompactProductContext(text.trim()));
        }
      })
      .catch((error) => {
        console.error('Failed to load chatbot product introduction:', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const pushMsg = useCallback((role: ChatRole, text: string) => {
    if (!text.trim()) {
      return;
    }

    setMessages((previous) => {
      const next = [...previous, createMessage(role, text.trim())];
      messagesRef.current = next;
      return next;
    });
  }, []);

  const sendLeadNotification = useCallback(async (leadSession: SessionData, transcript: ChatMessage[]) => {
    try {
      const analysis = buildLeadAnalysis(transcript, leadSession);
      const emailResult = await sendEmail(leadSession, analysis, transcript);
      if (!emailResult.emailed) {
        pushMsg('model', `I couldn't send the notification email. Debug: ${emailResult.debugMessage || 'No server debug returned.'}`);
      }
    } catch {
      pushMsg('model', `I couldn't confirm email delivery. Please try again or contact ${CONTACT_EMAIL} directly.`);
    }
  }, [pushMsg]);

  const applySessionUpdate = useCallback((
    update: {
      extractedData?: Partial<Omit<SessionData, 'stage'>>;
      nextStage?: Stage;
    },
    transcript?: ChatMessage[],
  ) => {
    const previousSession = sessionDataRef.current;
    const updatedSession = mergeSessionData(previousSession, update.extractedData, update.nextStage);

    sessionDataRef.current = updatedSession;
    setSession(updatedSession);

    if (shouldNotifyLead(previousSession, updatedSession) && !emailSentRef.current) {
      setEmailSent(true);
      emailSentRef.current = true;

      if (transcript) {
        void sendLeadNotification(updatedSession, transcript);
      } else {
        pendingLeadSessionRef.current = updatedSession;
      }
    }

    return updatedSession;
  }, [sendLeadNotification]);

  const stopAudio = useCallback(() => {
    sourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Ignore stopped nodes.
      }
    });
    sourcesRef.current.clear();
    nextPlayTime.current = 0;
  }, []);

  const stopVoice = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }

    stopAudio();
    currentInputTranscription.current = '';
    currentOutputTranscription.current = '';
    pendingLeadSessionRef.current = null;
    setIsListening(false);
    setIsConnecting(false);
    setMode('text');
  }, [stopAudio]);

  useEffect(() => {
    return () => {
      stopVoice();
    };
  }, [stopVoice]);

  const handleTextSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!inputText.trim() || isModelTyping) {
      return;
    }

    const text = inputText.trim();
    const previousMessages = messagesRef.current;
    const userMessage = createMessage('user', text);
    const historyMessages = [...previousMessages, userMessage];

    setInputText('');
    messagesRef.current = historyMessages;
    setMessages(historyMessages);
    setIsModelTyping(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Missing GEMINI_API_KEY');
      }

      const ai = new GoogleGenAI({ apiKey });
      const history = historyMessages.slice(-MAX_HISTORY_MESSAGES).map((message) => ({
        role: message.role,
        parts: [{ text: message.text }],
      }));

      const result = await ai.models.generateContent({
        model: CHAT_MODEL,
        contents: history,
        config: {
          systemInstruction: systemPrompt(sessionDataRef.current, productContextRef.current),
          responseMimeType: 'application/json',
          responseSchema: CHAT_RESPONSE_SCHEMA,
        },
      });

      const structured = JSON.parse(result.text || '{}') as StructuredChatResponse;
      const messageText = structured.message?.trim() || "Sorry, I couldn't process that. Could you try again?";
      const assistantMessage = createMessage('model', messageText);
      const transcript = [...historyMessages, assistantMessage];

      messagesRef.current = transcript;
      setMessages(transcript);
      applySessionUpdate(structured, transcript);
    } catch (error) {
      console.error('Chat error:', error);
      const detail = error instanceof Error ? error.message : 'Unknown Gemini error';
      pushMsg('model', `${CHAT_FAILURE_MESSAGE}\n\nDebug: ${detail}`);
    } finally {
      setIsModelTyping(false);
    }
  };

  const startVoice = async () => {
    if (isConnecting || mode === 'voice') {
      return;
    }

    setIsConnecting(true);
    setMode('voice');

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Missing GEMINI_API_KEY');
      }

      const ai = new GoogleGenAI({ apiKey });

      if (!inputAudioCtx.current) {
        inputAudioCtx.current = new AudioContext({ sampleRate: 16000 });
      }

      if (!outputAudioCtx.current) {
        outputAudioCtx.current = new AudioContext({ sampleRate: 24000 });
      }

      const microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = microphone;
      currentInputTranscription.current = '';
      currentOutputTranscription.current = '';

      const updateLeadInfoTool = {
        functionDeclarations: [
          {
            name: 'updateLeadInfo',
            description: 'Update the SubNest lead information and move the conversation to the correct stage.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                extractedData: SESSION_DATA_SCHEMA,
                nextStage: { type: Type.STRING },
              },
            },
          },
        ],
      } as const;

      const liveSession = await ai.live.connect({
        model: VOICE_MODEL,
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsListening(true);

            const source = inputAudioCtx.current!.createMediaStreamSource(microphone);
            const processor = inputAudioCtx.current!.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = (audioEvent) => {
              const input = audioEvent.inputBuffer.getChannelData(0);
              const pcm = new Int16Array(input.length);

              for (let index = 0; index < input.length; index += 1) {
                pcm[index] = input[index] * 32768;
              }

              if (sessionRef.current) {
                sessionRef.current.sendRealtimeInput({
                  media: {
                    data: pcmEncode(new Uint8Array(pcm.buffer)),
                    mimeType: 'audio/pcm;rate=16000',
                  },
                });
              }
            };

            source.connect(processor);
            processor.connect(inputAudioCtx.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall) {
              for (const call of message.toolCall.functionCalls) {
                if (call.name === 'updateLeadInfo') {
                  const args = typeof call.args === 'string'
                    ? JSON.parse(call.args)
                    : (call.args || {});
                  const updatedSession = applySessionUpdate(args);

                  if (sessionRef.current) {
                    sessionRef.current.sendToolResponse({
                      functionResponses: [{
                        name: 'updateLeadInfo',
                        id: call.id,
                        response: {
                          result: 'success',
                          nextStage: updatedSession.stage,
                          knownData: updatedSession,
                        },
                      }],
                    });
                  }
                }
              }
            }

            const parts = message.serverContent?.modelTurn?.parts || [];

            for (const part of parts) {
              if (part.inlineData?.data && outputAudioCtx.current) {
                const ctx = outputAudioCtx.current;
                nextPlayTime.current = Math.max(nextPlayTime.current, ctx.currentTime);

                const audioBuffer = await toAudioBuffer(pcmDecode(part.inlineData.data), ctx, 24000);
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.start(nextPlayTime.current);
                nextPlayTime.current += audioBuffer.duration;
                sourcesRef.current.add(source);
                source.onended = () => sourcesRef.current.delete(source);
              }
            }

            if (message.serverContent?.inputTranscription?.text) {
              currentInputTranscription.current += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.outputTranscription?.text) {
              currentOutputTranscription.current += message.serverContent.outputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              const turnMessages: ChatMessage[] = [];
              const userText = currentInputTranscription.current.trim();
              const modelText = currentOutputTranscription.current.trim();

              if (userText) {
                turnMessages.push(createMessage('user', userText));
              }

              if (modelText) {
                turnMessages.push(createMessage('model', modelText));
              }

              const nextMessages = turnMessages.length > 0
                ? [...messagesRef.current, ...turnMessages]
                : messagesRef.current;

              if (turnMessages.length > 0) {
                messagesRef.current = nextMessages;
                setMessages(nextMessages);
              }

              if (pendingLeadSessionRef.current) {
                const readySession = pendingLeadSessionRef.current;
                pendingLeadSessionRef.current = null;
                void sendLeadNotification(readySession, nextMessages);
              }

              currentInputTranscription.current = '';
              currentOutputTranscription.current = '';
            }

            if (message.serverContent?.interrupted) {
              stopAudio();
            }
          },
          onerror: (error) => {
            console.error('Voice session error:', error);
            stopVoice();
          },
          onclose: () => {
            setIsConnecting(false);
            setIsListening(false);
            sessionRef.current = null;
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: voiceSystemPrompt(sessionDataRef.current, productContextRef.current),
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [updateLeadInfoTool],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Kore',
              },
            },
          },
        },
      });

      sessionRef.current = liveSession;
    } catch (error) {
      console.error('Voice start failed:', error);
      setIsConnecting(false);
      setIsListening(false);
      setMode('text');
    }
  };

  const clearChat = () => {
    if (!window.confirm('Clear chat and start over?')) {
      return;
    }

    stopVoice();
    const initialMessages = [createMessage('model', WELCOME)];
    messagesRef.current = initialMessages;
    sessionDataRef.current = INITIAL_SESSION;
    pendingLeadSessionRef.current = null;
    setMessages(initialMessages);
    setSession(INITIAL_SESSION);
    setEmailSent(false);
    emailSentRef.current = false;
  };

  const stageLabel: Record<Stage, string> = {
    intent: 'Getting Started',
    core_needs: 'Understanding Fit',
    core_needs_timeline: 'Timeline',
    intent_specific: 'Current Setup',
    value_exchange: 'Next Steps',
    lead_name: 'Contact Details',
    lead_phone: 'Contact Details',
    lead_email: 'Contact Details',
    handoff: 'Scheduling',
    complete: 'Connected',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-[400px] h-[620px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
          >
            <div className="p-6 bg-brand-navy text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <Bot size={24} className="text-brand-cyan" />
                </div>
                <div>
                  <h3 className="font-bold">SubNest AI</h3>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${mode === 'voice' ? 'bg-red-400' : 'bg-green-500'} animate-pulse`} />
                    <span className="text-xs text-brand-cyan font-medium">
                      {mode === 'voice'
                        ? isConnecting
                          ? 'Connecting Voice'
                          : 'Voice Active'
                        : stageLabel[session.stage]}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearChat}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Clear chat"
                >
                  <RotateCcw size={18} />
                </button>
                <button
                  onClick={() => {
                    stopVoice();
                    setIsOpen(false);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, x: message.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        message.role === 'user'
                          ? 'bg-brand-blue text-white'
                          : 'bg-white border border-slate-100 text-brand-navy'
                      }`}
                    >
                      {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        message.role === 'user'
                          ? 'bg-brand-navy text-white rounded-tr-none'
                          : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                      }`}
                    >
                      {renderMessageText(message.text)}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isModelTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center shrink-0">
                      <Bot size={16} className="text-brand-navy" />
                    </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}

              {mode === 'voice' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center space-y-4">
                  <div className="flex items-end justify-center gap-1.5 h-16">
                    {[...Array(7)].map((_, index) => (
                      <div
                        key={`voice-bar-${index}`}
                        className="w-1.5 bg-brand-blue rounded-full animate-pulse"
                        style={{
                          animationDelay: `${index * 0.1}s`,
                          height: isListening ? `${24 + ((index * 11) % 36)}px` : '6px',
                        }}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-slate-500">
                    {isConnecting ? 'Connecting your voice session...' : 'Voice conversation is transcribed below.'}
                  </div>
                  <button
                    onClick={stopVoice}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-navy text-white text-sm font-semibold hover:bg-brand-navy/90 transition-colors"
                  >
                    <Mic size={16} />
                    Return to Text
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {mode === 'text' && (
              <div className="p-6 bg-white border-t border-slate-100">
                <form onSubmit={handleTextSubmit} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={startVoice}
                    className="p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                    title="Start voice mode"
                  >
                    <Mic size={20} />
                  </button>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(event) => setInputText(event.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-slate-100 text-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isModelTyping}
                    className="p-3 bg-brand-navy text-white rounded-xl hover:bg-brand-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen((open) => !open)}
        className="w-16 h-16 bg-brand-navy text-white rounded-full shadow-2xl flex items-center justify-center relative group"
      >
        {isOpen ? <X size={32} /> : <MessageSquare size={32} />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-blue rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold">
            1
          </span>
        )}
      </motion.button>
    </div>
  );
}
