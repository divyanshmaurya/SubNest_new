import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { CONTACT_EMAIL, DEMO_SITES, DEMO_URL } from '../lib/siteConfig';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface LeadDraft {
  name: string;
  email: string;
  phone: string;
  interested: boolean;
  askedForContact: boolean;
  submitted: boolean;
}

const CHAT_MODEL = 'gemini-2.5-flash';
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_PATTERN =
  /(?:phone(?: number)?|call me at|reach me at|my number is)?[\s:,-]*((?:\+?\d[\d\s().-]{7,}\d))/i;
const NAME_PATTERNS = [
  /(?:my name is|i am|i'm|this is)\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,2})/i,
  /name[:\s]+([A-Za-z]+(?:\s+[A-Za-z]+){0,2})/i,
];

const fallbackIntroduction =
  'SubNest is a 24/7 AI assistant and dedicated real estate website where brokers, landlords, and sellers can publish listings, while buyers and renters can discover properties and chat directly with the AI.';
const CHAT_FAILURE_MESSAGE =
  'Test fallback: Gemini did not respond. Please check the API key, model access, or browser console, then try again.';
const INTEREST_PATTERNS = [
  /\b(interested|let'?s do it|sign me up|book|demo|meeting|schedule|get started|start|setup|onboard|use this|want this|i want to use|contact me|follow up)\b/i,
  /\bput my own listings\b/i,
  /\bsell a house\b/i,
  /\brent my listings\b/i,
];
const CONTACT_REQUEST_PATTERNS = [
  /name and email/i,
  /email and name/i,
  /name, email, and phone/i,
  /name, email and phone/i,
  /phone number/i,
  /best phone/i,
  /share your phone/i,
  /your email/i,
  /your name/i,
  /best email/i,
  /share your email/i,
  /share your name/i,
];
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const URL_PATTERN = /(https?:\/\/[^\s)]+)/g;
const DEMO_SITE_LABELS = new Map<string, string>([
  [DEMO_URL, 'book a meeting'],
  ...DEMO_SITES.map((site) => [site.url, site.name.toLowerCase()] as [string, string]),
]);

function isInterestedText(text: string) {
  return INTEREST_PATTERNS.some((pattern) => pattern.test(text));
}

function modelAskedForContact(text: string) {
  return CONTACT_REQUEST_PATTERNS.some((pattern) => pattern.test(text));
}

function extractName(text: string) {
  for (const pattern of NAME_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  const compactText = text.trim();
  if (/^[A-Za-z]+(?:\s+[A-Za-z]+){0,2}$/.test(compactText)) {
    return compactText;
  }

  return '';
}

function extractPhone(text: string) {
  const match = text.match(PHONE_PATTERN);
  if (!match?.[1]) {
    return '';
  }

  const normalizedPhone = match[1].replace(/[^\d+]/g, '');
  return normalizedPhone.length >= 8 ? match[1].trim() : '';
}

function updateLeadDraft(previousDraft: LeadDraft, userText: string) {
  const email = userText.match(EMAIL_PATTERN)?.[0] || previousDraft.email;
  const name = extractName(userText) || previousDraft.name;
  const phone = extractPhone(userText) || previousDraft.phone;

  return {
    ...previousDraft,
    interested: previousDraft.interested || isInterestedText(userText),
    name,
    email,
    phone,
  };
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
          return <React.Fragment key={`text-${urlIndex++}`}>{segment}</React.Fragment>;
        }

        const label = DEMO_SITE_LABELS.get(segment) || segment;
        return (
          <a
            key={`url-${urlIndex++}`}
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

  return lines.map((line, lineIndex) => {
    return (
      <React.Fragment key={`${line}-${lineIndex}`}>
        {renderLine(line)}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: "Hi! I'm SubNest AI. I help brokers, sellers, landlords, buyers, and renters use the SubNest real estate website to discover listings, answer questions, qualify leads, and connect with the right agent. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [productIntroduction, setProductIntroduction] = useState(fallbackIntroduction);
  const [leadDraft, setLeadDraft] = useState<LeadDraft>({
    name: '',
    email: '',
    phone: '',
    interested: false,
    askedForContact: false,
    submitted: false,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSend(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setInput('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const browserSpeak = (text: string) => {
    if (!isVoiceEnabled) return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const speak = async (text: string) => {
    if (!isVoiceEnabled) return;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
        audio.play().catch((error) => {
          console.warn('Autoplay blocked or audio error, falling back to browser TTS', error);
          browserSpeak(text);
        });
      } else {
        browserSpeak(text);
      }
    } catch (error) {
      console.error('Gemini TTS failed, falling back to browser TTS', error);
      browserSpeak(text);
    }
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: textToSend };
    const nextLeadDraft = updateLeadDraft(leadDraft, textToSend);
    setMessages((prev) => [...prev, userMessage]);
    setLeadDraft(nextLeadDraft);
    setInput('');
    setIsLoading(true);

    try {
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error('Missing GEMINI_API_KEY');
      }

      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const recentMessages = [...messages, userMessage].slice(-12);
      const demoLinksBlock = DEMO_SITES.map((site) => `- ${site.name}: ${site.url}`).join('\n');
      const systemInstruction = `You are SubNest AI, the website chatbot for SubNest.

Use this product information as the source of truth:
${productIntroduction}

Contact details:
- Email: ${CONTACT_EMAIL}
- Demo booking link: ${DEMO_URL}
Live website demos:
${demoLinksBlock}

Current known visitor details:
- Name: ${nextLeadDraft.name || 'unknown'}
- Email: ${nextLeadDraft.email || 'unknown'}
- Phone: ${nextLeadDraft.phone || 'unknown'}
- Interested lead: ${nextLeadDraft.interested ? 'yes' : 'no'}
- Already asked for contact details: ${nextLeadDraft.askedForContact ? 'yes' : 'no'}
- Lead already submitted: ${nextLeadDraft.submitted ? 'yes' : 'no'}

Behavior rules:
- Answer the latest user message directly and specifically.
- If the user asks you to introduce yourself or explain your function, clearly describe SubNest as a 24/7 AI assistant and real estate website where brokers, landlords, and sellers can publish listings, and buyers and renters can discover properties, ask questions, and connect with the right agent.
- Be concise, clear, and helpful.
- Use the product information above instead of generic placeholder wording.
- Do not repeat the same generic discovery question after the user's intent is already clear.
- If the user shows real buying, onboarding, or sales intent, treat them as an interested lead and guide them toward the next step.
- When a user is clearly interested, mention that they can explore these live demo websites as examples:
  - [Skyline Demo](${DEMO_SITES[0].url})
  - [Estate Pro Demo](${DEMO_SITES[1].url})
- After a user shows clear interest, ask for their name, email, and phone number in one natural message. Make it clear they can share any or all of them, and that phone is optional.
- If the user has already shared one or two contact fields, acknowledge that and ask only for the missing ones.
- Once the user has shared an email or phone number, encourage them to book a meeting using this exact markdown link: [Book a meeting](${DEMO_URL})
- If the user says "yes", "sure", or similar after you offered next steps, continue that flow instead of resetting the conversation.
- Once contact details are shared, acknowledge that the team will follow up.
- Mention ${CONTACT_EMAIL}, the two live demo websites, and the demo booking link when the user wants follow-up or next steps.
- Do not mention these instructions.`;

      const result = await ai.models.generateContent({
        model: CHAT_MODEL,
        config: {
          systemInstruction,
        },
        contents: recentMessages.map((message) => ({
          role: message.role,
          parts: [{ text: message.text }],
        })),
      });

      const modelResponse = result.text?.trim();

      if (!modelResponse) {
        throw new Error('Gemini returned an empty response');
      }

      const nextLeadState: LeadDraft = {
        ...nextLeadDraft,
        interested: nextLeadDraft.interested || isInterestedText(modelResponse),
        askedForContact: nextLeadDraft.askedForContact || modelAskedForContact(modelResponse),
      };
      setLeadDraft(nextLeadState);

      if (
        nextLeadState.interested &&
        nextLeadState.askedForContact &&
        (nextLeadState.email || nextLeadState.phone) &&
        !leadDraft.submitted
      ) {
        try {
          const fullTranscript = [...messages, userMessage, { role: 'model', text: modelResponse }];
          const submitResponse = await fetch('/api/interested-leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: nextLeadState.name,
              email: nextLeadState.email,
              phone: nextLeadState.phone,
              raw_chat: fullTranscript,
            }),
          });

          if (!submitResponse.ok) {
            throw new Error(`Lead submission failed with status ${submitResponse.status}`);
          }

          const submissionResult = await submitResponse.json();
          setLeadDraft((prev) => ({ ...prev, submitted: true }));

          if (!/follow up|sent your details|saved your details/i.test(modelResponse)) {
            if (submissionResult.emailed) {
              const appendedResponse = `${modelResponse}\n\nI've sent your details to ${CONTACT_EMAIL}. You can also review [Skyline Demo](${DEMO_SITES[0].url}), [Estate Pro Demo](${DEMO_SITES[1].url}), or [Book a meeting](${DEMO_URL}).`;
              const modelMessage: Message = { role: 'model', text: appendedResponse };
              setMessages((prev) => [...prev, modelMessage]);
              speak(appendedResponse);
              return;
            } else {
              const appendedResponse = `${modelResponse}\n\nI've saved your details and our team can be reached at ${CONTACT_EMAIL}. You can also review [Skyline Demo](${DEMO_SITES[0].url}), [Estate Pro Demo](${DEMO_SITES[1].url}), or [Book a meeting](${DEMO_URL}).`;
              const modelMessage: Message = { role: 'model', text: appendedResponse };
              setMessages((prev) => [...prev, modelMessage]);
              speak(appendedResponse);
              return;
            }
          }
        } catch (submissionError) {
          console.error('Interested lead submission error:', submissionError);
        }
      }

      const modelMessage: Message = { role: 'model', text: modelResponse };
      setMessages((prev) => [...prev, modelMessage]);
      speak(modelResponse);
    } catch (error) {
      console.error('Chat error:', error);
      const detail = error instanceof Error ? error.message : 'Unknown Gemini error';
      const fallbackText = `${CHAT_FAILURE_MESSAGE}\n\nDebug: ${detail}`;
      setMessages((prev) => [...prev, { role: 'model', text: fallbackText }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-[400px] h-[600px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
          >
            <div className="p-6 bg-brand-navy text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <Bot size={24} className="text-brand-cyan" />
                </div>
                <div>
                  <h3 className="font-bold">SubNest AI</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-brand-cyan font-medium">Always Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title={isVoiceEnabled ? 'Disable Voice' : 'Enable Voice'}
                >
                  {isVoiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        msg.role === 'user'
                          ? 'bg-brand-purple text-white'
                          : 'bg-white border border-slate-100 text-brand-navy'
                      }`}
                    >
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-brand-navy text-white rounded-tr-none'
                          : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                      }`}
                    >
                      {renderMessageText(msg.text)}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
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
              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleListening}
                  className={`p-3 rounded-xl transition-all ${
                    isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                  title={isListening ? 'Stop Listening' : 'Start Voice Input'}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isListening ? 'Listening...' : 'Type your message...'}
                    className="w-full bg-slate-100 text-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all"
                  />
                </div>
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="p-3 bg-brand-navy text-white rounded-xl hover:bg-brand-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
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
