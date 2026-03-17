import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Mic, RotateCcw } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
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

const CHAT_MODEL = 'gemini-2.5-flash';
const VOICE_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';
const INITIAL_SESSION: SessionData = { stage: 'intent' };
const WELCOME =
  "Hi! I'm SubNest AI. I can explain how the website works, show where it fits, and help you decide if it's a fit for your real estate business. Are you looking to use SubNest for your own team, or just exploring how it works?";
const FALLBACK_INTRODUCTION =
  'SubNest is a 24/7 AI assistant and dedicated real estate website where brokers, landlords, and sellers can publish listings, while buyers and renters can discover properties and chat directly with the AI.';
const CHAT_FAILURE_MESSAGE =
  'SubNest AI could not get a response right now. Please check the Gemini API key or browser console, then try again.';
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const URL_PATTERN = /(https?:\/\/[^\s)]+)/g;
const DEMO_SITE_LABELS = new Map<string, string>([
  [DEMO_URL, 'book a meeting'],
  ...DEMO_SITES.map((site) => [site.url, site.name.toLowerCase()] as [string, string]),
]);

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
  const lines = text.split('\n');

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

function systemPrompt(session: SessionData, productIntroduction: string) {
  const demoLinksBlock = DEMO_SITES.map((site) => `${site.name}: ${site.url}`).join('\n');

  return `You are a friendly, warm AI assistant for SubNest. Talk like a real person - short, casual, natural sentences. You are helping visitors understand the SubNest website and qualify interested real estate professionals.

RULES:
- NEVER use markdown bullets or headings.
- NEVER reveal internal reasoning, plans, or what you are about to do.
- NEVER say things like "I've registered", "switching stages", or "my assessment".
- If the user asks a direct question, answer it briefly first, then ask the next relevant question.
- Only use the product information below as the source of truth. Do not invent pricing, integrations, or promises that are not supported there.
- If you share a demo or booking link, use the raw URL on its own line.
- 1-3 short sentences max. Sound human, not robotic.

STAGE: ${session.stage}
DATA: ${JSON.stringify(session)}
PRODUCT_INFO:
${productIntroduction}
CONTACT_EMAIL: ${CONTACT_EMAIL}
BOOKING_LINK: ${DEMO_URL}
DEMO_LINKS:
${demoLinksBlock}

WHAT TO SAY (only for current stage):

intent -> Figure out who they are and what they want from SubNest. If they ask what SubNest is, explain it briefly using PRODUCT_INFO, then ask whether they want SubNest for their own brokerage, landlord, or sales business, or if they are just exploring.
core_needs -> They shared who they are. Acknowledge, then ask: "What kind of listings or clients are you focused on, and what's the main thing you'd want SubNest to help with?"
core_needs_timeline -> They shared goals. Ask: "And what's your timeline for getting something like this live?"
intent_specific -> They shared timeline. Ask: "Are you replacing an existing website or lead workflow, or would this be a fresh setup?"
value_exchange -> Only use this stage once the user sounds genuinely interested in a demo, pricing, setup, or follow-up. Mention the two demo sites naturally, then ask: "Can I get your name so our team can follow up with the right walkthrough?"
lead_name -> Got name. "Thanks, [Name]! What's your cell phone number?"
lead_phone -> Got number? "Got it! And what's your email address?" Refused? "No problem - I do need at least one reliable way for our team to follow up. Would you rather share your email?"
lead_email -> Got or skipped email. "Last thing - would you prefer our team to reach out by text, call, or email? And what time works best?"
handoff -> Got preference and time. "Perfect, [Name]! We'll reach out by [text/call/email] around [time]. You can also check the live demos or book a meeting here." Then put each raw URL on its own line.
complete -> Chat naturally about SubNest, setup, demos, pricing questions, and next steps.

IMPORTANT:
- Do not advance to value_exchange or later stages unless the user is clearly interested in using SubNest or wants follow-up.
- If the user is still just asking general questions, answer them and keep next_stage at the current stage.

After your response, on a NEW line add this hidden block:
|||EXTRACT|||{"stage":"${session.stage}","next_stage":"<next>","data":{<fields>}}|||END|||

Transitions: intent -> core_needs -> core_needs_timeline -> intent_specific -> value_exchange -> lead_name -> lead_phone -> lead_email -> handoff -> complete
Keys: intent, audienceType, market, goals, timeline, currentSetup, painPoint, demoInterest, firstName, lastName, phone, email, contactPreference, bestTime
Keep next_stage = current stage if extraction is incomplete or the user is not yet clearly interested.`;
}

function voiceSystemPrompt(session: SessionData, productIntroduction: string) {
  const demoLinksBlock = DEMO_SITES.map((site) => `${site.name}: ${site.url}`).join('\n');

  return `You are a friendly SubNest assistant on a voice call. Talk like a real person - casual, warm, short sentences.

RULES:
- NEVER describe what you are doing internally.
- NEVER use markdown.
- NEVER narrate your thought process.
- Just say what you would actually say out loud to a person on the phone.
- 1-3 short, natural sentences only.
- Use this product info as your source of truth: ${productIntroduction}

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
complete -> Chat naturally about SubNest and next steps.`;
}

async function generateLeadAnalysis(
  messages: ChatMessage[],
  session: SessionData,
  productIntroduction: string,
): Promise<LeadAnalysis> {
  const fallbackScore = session.bestTime && (session.phone || session.email) ? 7 : 5;
  const fallbackCategory = getLeadCategory(fallbackScore);
  const fallback: LeadAnalysis = {
    score: fallbackScore,
    scoreReason: `Fallback ${fallbackCategory.toLowerCase()} lead assessment based on captured contact details and buying signals.`,
    analysis: [
      `${fallbackCategory} lead for SubNest.`,
      `Intent: ${session.intent || 'Not specified'}.`,
      `Audience type: ${session.audienceType || 'Not specified'}.`,
      `Market: ${session.market || 'Not specified'}.`,
      `Goals: ${session.goals || 'Not specified'}.`,
      `Pain point: ${session.painPoint || 'Not specified'}.`,
      `Timeline: ${session.timeline || 'Not specified'}.`,
      `Current setup: ${session.currentSetup || 'Not specified'}.`,
      `Preferred contact: ${session.contactPreference || 'Not specified'} at ${session.bestTime || 'Not specified'}.`,
      `Phone: ${session.phone || 'Not provided'}.`,
      `Email: ${session.email || 'Not provided'}.`,
    ].join(' '),
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      return fallback;
    }

    const ai = new GoogleGenAI({ apiKey });
    const transcript = messages
      .map((message) => `${message.role === 'user' ? 'Customer' : 'AI'}: ${message.text}`)
      .join('\n');

    const response = await ai.models.generateContent({
      model: CHAT_MODEL,
      contents: [{
        role: 'user',
        parts: [{
          text: `You are a senior real estate sales analyst. Analyze this chatbot lead conversation for SubNest, an AI website and lead-conversion product for real estate professionals.

Product context:
${productIntroduction}

Conversation Transcript:
${transcript}

Session Data:
${JSON.stringify(session, null, 2)}

Return a JSON object with:
- score: integer 1-10 (lead quality: 10 = extremely hot, ready for a demo or onboarding; 1 = cold / low-intent)
- scoreReason: 1-2 sentence explanation of the score
- analysis: 200-250 word professional analysis covering:
  1. Customer intent and motivation
  2. Business type, market, and fit for SubNest
  3. Goals, pain points, and timeline
  4. Engagement level (High/Medium/Low)
  5. Key buying signals observed
  6. Recommended next action for the team`,
        }],
      }],
      config: {
        systemInstruction: 'You are an expert real estate SaaS sales analyst. Be concise, actionable, and always return valid JSON.',
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      score: Math.min(10, Math.max(1, Number(parsed.score) || fallback.score)),
      scoreReason: parsed.scoreReason || fallback.scoreReason,
      analysis: parsed.analysis || fallback.analysis,
    };
  } catch (error) {
    console.error('Lead analysis error:', error);
    return fallback;
  }
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
  const [productIntroduction, setProductIntroduction] = useState(FALLBACK_INTRODUCTION);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  const sessionDataRef = useRef(session);
  const emailSentRef = useRef(emailSent);
  const productIntroductionRef = useRef(productIntroduction);
  const sessionRef = useRef<any>(null);
  const speechRecRef = useRef<any>(null);
  const inputAudioCtx = useRef<AudioContext | null>(null);
  const outputAudioCtx = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextPlayTime = useRef(0);
  const isGeneratingText = useRef(false);

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
    productIntroductionRef.current = productIntroduction;
  }, [productIntroduction]);

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
          setProductIntroduction(text.trim());
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

    setMessages((previous) => [...previous, createMessage(role, text.trim())]);
  }, []);

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
    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch {
        // Ignore speech recognition stop errors.
      }
      speechRecRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }

    stopAudio();
    isGeneratingText.current = false;
    setIsListening(false);
    setIsConnecting(false);
    setMode('text');
  }, [stopAudio]);

  useEffect(() => {
    return () => {
      stopVoice();
    };
  }, [stopVoice]);

  const parseExtraction = useCallback((fullText: string) => {
    if (!fullText.includes('|||EXTRACT|||')) {
      return fullText.trim();
    }

    const [displayText, rest] = fullText.split('|||EXTRACT|||');
    const jsonText = rest?.split('|||END|||')[0]?.trim();

    if (jsonText) {
      try {
        const parsed = JSON.parse(jsonText) as {
          next_stage?: Stage;
          data?: Partial<Omit<SessionData, 'stage'>>;
        };

        setSession((previous) => {
          const updated: SessionData = { ...previous };

          if (parsed.data) {
            for (const [key, value] of Object.entries(parsed.data) as Array<
              [keyof Omit<SessionData, 'stage'>, SessionData[keyof Omit<SessionData, 'stage'>]]
            >) {
              if (value) {
                updated[key] = value;
              }
            }
          }

          if (parsed.next_stage) {
            updated.stage = parsed.next_stage;
          }

          const display = displayText.trim();
          const bestTimeJustCaptured = !previous.bestTime && Boolean(updated.bestTime);

          if (
            bestTimeJustCaptured &&
            (updated.phone || updated.email) &&
            !emailSentRef.current
          ) {
            const transcript = display
              ? [...messagesRef.current, createMessage('model', display)]
              : [...messagesRef.current];

            setEmailSent(true);
            emailSentRef.current = true;

            void (async () => {
              try {
                const analysis = await generateLeadAnalysis(
                  transcript,
                  updated,
                  productIntroductionRef.current,
                );
                const emailResult = await sendEmail(updated, analysis, transcript);
                pushMsg(
                  'model',
                  emailResult.emailed
                    ? `Perfect. I've sent your details to ${CONTACT_EMAIL}, and our team will follow up soon.`
                    : `Your details are saved, but the email was not sent. Debug: ${emailResult.debugMessage || 'No server debug returned.'}`,
                );
              } catch {
                pushMsg('model', 'Your details are saved, and our team will follow up soon.');
              }
            })();
          }

          return updated;
        });
      } catch (error) {
        console.error('Extract parse error:', error);
      }
    }

    return displayText.trim();
  }, [pushMsg]);

  const handleTextSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!inputText.trim() || isModelTyping) {
      return;
    }

    const text = inputText.trim();
    const userMessage = createMessage('user', text);

    setInputText('');
    setMessages((previous) => [...previous, userMessage]);
    setIsModelTyping(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Missing GEMINI_API_KEY');
      }

      const ai = new GoogleGenAI({ apiKey });
      const history = [...messagesRef.current, userMessage].slice(-12).map((message) => ({
        role: message.role,
        parts: [{ text: message.text }],
      }));

      const result = await ai.models.generateContent({
        model: CHAT_MODEL,
        contents: history,
        config: {
          systemInstruction: systemPrompt(sessionDataRef.current, productIntroductionRef.current),
        },
      });

      const fullText = result.text || "Sorry, I couldn't process that. Could you try again?";
      const display = parseExtraction(fullText);
      pushMsg('model', display);
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

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.onresult = (voiceEvent: any) => {
          const transcript = voiceEvent.results[voiceEvent.results.length - 1][0].transcript.trim();
          if (transcript) {
            pushMsg('user', transcript);
          }
        };
        recognition.onerror = (voiceEvent: any) => {
          if (voiceEvent.error !== 'aborted') {
            try {
              recognition.start();
            } catch {
              // Ignore restart failures.
            }
          }
        };
        recognition.onend = () => {
          if (sessionRef.current) {
            try {
              recognition.start();
            } catch {
              // Ignore restart failures.
            }
          }
        };
        recognition.start();
        speechRecRef.current = recognition;
      }

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

            if (message.serverContent?.turnComplete && !isGeneratingText.current) {
              isGeneratingText.current = true;

              try {
                const textAi = new GoogleGenAI({ apiKey });
                const history = messagesRef.current.slice(-12).map((entry) => ({
                  role: entry.role,
                  parts: [{ text: entry.text }],
                }));

                if (history.length === 0) {
                  history.push({ role: 'user', parts: [{ text: 'Hello' }] });
                }

                const lastMessage = history[history.length - 1];
                if (lastMessage.role !== 'user') {
                  isGeneratingText.current = false;
                  return;
                }

                const result = await textAi.models.generateContent({
                  model: CHAT_MODEL,
                  contents: history,
                  config: {
                    systemInstruction: systemPrompt(sessionDataRef.current, productIntroductionRef.current),
                  },
                });

                const fullText = result.text?.trim() || '';
                if (fullText) {
                  const display = parseExtraction(fullText);
                  pushMsg('model', display);
                }
              } catch (error) {
                console.error('Voice text generation error:', error);
              } finally {
                isGeneratingText.current = false;
              }
            }

            if (message.serverContent?.interrupted) {
              stopAudio();
            }
          },
          onerror: (error) => {
            console.error('Voice session error:', error);
            setIsConnecting(false);
            setIsListening(false);
          },
          onclose: () => {
            setIsConnecting(false);
            setIsListening(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: voiceSystemPrompt(sessionDataRef.current, productIntroductionRef.current),
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
    setMessages([createMessage('model', WELCOME)]);
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
                          ? 'bg-brand-purple text-white'
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
                    className="flex-1 bg-slate-100 text-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isModelTyping}
                    className="p-3 bg-brand-navy text-white rounded-xl hover:bg-brand-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Send size={20} />
                  </button>
                </form>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Gemini 2.5 Flash + live audio</span>
                  <span>{emailSent ? 'Lead captured' : 'Live intro flow'}</span>
                </div>
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
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-purple rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold">
            1
          </span>
        )}
      </motion.button>
    </div>
  );
}
