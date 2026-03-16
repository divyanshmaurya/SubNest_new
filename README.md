# SubNest Website

This repository contains the official SubNest marketing website and its guided AI chatbot.

The chatbot can:
- answer questions about [`public/chatbot-product-introduction.txt`](/Users/rex-shih/Documents/startup/SubNest_intro/SubNest/public/chatbot-product-introduction.txt)
- detect interested visitors
- ask for the visitor's name and email
- save leads locally
- email interested lead details to `subnest.ai@gmail.com` when notifications are configured

## Prerequisites

- Node.js 20+ recommended
- npm
- A Gemini API key
- An email delivery option for lead notifications

## Install

```bash
npm install
```

## Local Environment Setup

Create a `.env.local` or `.env` file in the project root.

Recommended setup with Resend:

```env
GEMINI_API_KEY="your-gemini-api-key"
NOTIFICATION_EMAIL_TO="subnest.ai@gmail.com"
RESEND_API_KEY="re_123"
EMAIL_FROM="SubNest Website <onboarding@resend.dev>"
```

Optional SMTP fallback:

```env
GEMINI_API_KEY="your-gemini-api-key"
NOTIFICATION_EMAIL_TO="subnest.ai@gmail.com"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="smtp-user"
SMTP_PASS="smtp-password"
SMTP_FROM="SubNest Website <no-reply@subnest.ai>"
```

### Environment Variables

- `GEMINI_API_KEY`
  Used by the chatbot for Gemini responses and text-to-speech.

- `NOTIFICATION_EMAIL_TO`
  Inbox that should receive interested lead notifications. Defaults to `subnest.ai@gmail.com`.

- `RESEND_API_KEY`
  API key for Resend. If this and `EMAIL_FROM` are present, the app uses Resend instead of SMTP.

- `EMAIL_FROM`
  Sender identity used with Resend.

- `SMTP_HOST`
  SMTP server hostname.

- `SMTP_PORT`
  SMTP port. Common values are `587` for TLS and `465` for SSL.

- `SMTP_USER`
  SMTP login username.

- `SMTP_PASS`
  SMTP login password or app password.

- `SMTP_FROM`
  Sender identity shown in outgoing email when SMTP is used.

## Notification Provider Notes

The server now supports two delivery methods:

- `Resend API` (recommended)
- `SMTP` (fallback)

Resend is the simplest way to send notifications to a Gmail inbox without dealing with Gmail SMTP authentication or app passwords.

Use SMTP only if you already have an SMTP provider you trust. If that SMTP provider is Gmail, you may still need Google-specific auth setup.

## Run Locally

```bash
npm run dev
```

The app runs on `http://localhost:3000`.

## How Lead Emailing Works

When the chatbot detects that a visitor is genuinely interested, it:

1. asks for the visitor's name and email
2. stores the lead in the local SQLite database
3. attempts to send an email notification to `NOTIFICATION_EMAIL_TO`

If email notifications are not configured correctly:
- the lead is still saved locally in `leads.db`
- the notification email will not be sent

## How To Test Locally

1. Start the app with `npm run dev`
2. Open the website
3. Chat with the bot as a potential customer
4. Ask about pricing, implementation, or trying the product
5. Provide a name and email when prompted
6. Confirm:
   - the lead appears in `leads.db`
   - the email reaches the inbox configured in `NOTIFICATION_EMAIL_TO`

## Update Chatbot Content

Edit:

[`public/chatbot-product-introduction.txt`](/Users/rex-shih/Documents/startup/SubNest_intro/SubNest/public/chatbot-product-introduction.txt)

This file is the chatbot's product knowledge source. Update it when product messaging, pricing, offers, or demo language changes.

## Cloud Run Setup

For production on Google Cloud Run, use Secret Manager for sensitive values.

Recommended secrets:
- `gemini-api-key`
- `notification-email-to`
- `resend-api-key`
- `email-from`

Optional SMTP fallback secrets:
- `smtp-host`
- `smtp-port`
- `smtp-user`
- `smtp-pass`
- `smtp-from`

Then map them into these environment variables in Cloud Run:
- `GEMINI_API_KEY`
- `NOTIFICATION_EMAIL_TO`
- `RESEND_API_KEY`
- `EMAIL_FROM`

Optional SMTP fallback:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

### Cloud Run UI Steps

1. Open your Cloud Run service
2. Click `Edit and deploy new revision`
3. Open `Variables & Secrets`
4. Add secret-backed environment variables for the values above
5. Deploy the new revision

### Example gcloud Command

```bash
gcloud run services update SERVICE_NAME \
  --update-secrets=GEMINI_API_KEY=gemini-api-key:latest,NOTIFICATION_EMAIL_TO=notification-email-to:latest,RESEND_API_KEY=resend-api-key:latest,EMAIL_FROM=email-from:latest
```

### Required IAM

The Cloud Run service account must be able to read those secrets.

Grant:
- `Secret Manager Secret Accessor`

## Build

```bash
npm run build
```

## Type Check

```bash
npm run lint
```

## Main Files

- [`src/components/Chatbot.tsx`](/Users/rex-shih/Documents/startup/SubNest_intro/SubNest/src/components/Chatbot.tsx)
- [`server.ts`](/Users/rex-shih/Documents/startup/SubNest_intro/SubNest/server.ts)
- [`public/chatbot-product-introduction.txt`](/Users/rex-shih/Documents/startup/SubNest_intro/SubNest/public/chatbot-product-introduction.txt)
- [`.env.example`](/Users/rex-shih/Documents/startup/SubNest_intro/SubNest/.env.example)
