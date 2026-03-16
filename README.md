# SubNest Website

This repository contains the official SubNest marketing website and its guided AI chatbot.

The chatbot can:
- answer questions about SubNest based on [`public/chatbot-product-introduction.txt`](/Users/rex-shih/Documents/startup/SubNest_new/public/chatbot-product-introduction.txt)
- detect interested visitors
- ask for the visitor's name and email
- save leads locally
- email interested lead details to `subnest.ai@gmail.com` when SMTP is configured

## Prerequisites

- Node.js 20+ recommended
- npm
- A Gemini API key
- An SMTP account for sending lead notification emails

## Install

```bash
npm install
```

## Local Environment Setup

Create a `.env.local` or `.env` file in the project root.

Example:

```env
GEMINI_API_KEY="your-gemini-api-key"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-smtp-user@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="SubNest Website <your-smtp-user@gmail.com>"
```

### Environment Variables

- `GEMINI_API_KEY`
  Used by the chatbot for Gemini responses and text-to-speech.

- `SMTP_HOST`
  SMTP server hostname, for example `smtp.gmail.com`.

- `SMTP_PORT`
  SMTP port. Common values are `587` for TLS and `465` for SSL.

- `SMTP_USER`
  SMTP login username.

- `SMTP_PASS`
  SMTP login password or app password.

- `SMTP_FROM`
  Sender identity shown in the outgoing email.

## SMTP Provider Notes

Any SMTP provider will work if it supports standard SMTP auth.

Common options:
- Gmail / Google Workspace SMTP
- SendGrid SMTP
- Mailgun SMTP
- Resend SMTP
- Zoho SMTP

If you use Gmail or Google Workspace:
- `SMTP_HOST` should be `smtp.gmail.com`
- `SMTP_PORT` should usually be `587`
- `SMTP_PASS` should be a Google App Password, not your normal account password

## Run Locally

```bash
npm run dev
```

The app runs on `http://localhost:3000`.

## How Lead Emailing Works

When the chatbot detects that a visitor is genuinely interested, it:

1. asks for the visitor's name and email
2. stores the lead in the local SQLite database
3. attempts to send an email notification to `subnest.ai@gmail.com`

If SMTP is not configured correctly:
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
   - the email reaches `subnest.ai@gmail.com`

## Update Chatbot Content

Edit:

[`public/chatbot-product-introduction.txt`](/Users/rex-shih/Documents/startup/SubNest_new/public/chatbot-product-introduction.txt)

This file is the chatbot's product knowledge source. Update it when product messaging, pricing, offers, or demo language changes.

## Cloud Run Setup

For production on Google Cloud Run, use Secret Manager for sensitive values.

Recommended secrets:
- `gemini-api-key`
- `smtp-host`
- `smtp-port`
- `smtp-user`
- `smtp-pass`
- `smtp-from`

Then map them into these environment variables in Cloud Run:
- `GEMINI_API_KEY`
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
  --update-secrets=GEMINI_API_KEY=gemini-api-key:latest,SMTP_HOST=smtp-host:latest,SMTP_PORT=smtp-port:latest,SMTP_USER=smtp-user:latest,SMTP_PASS=smtp-pass:latest,SMTP_FROM=smtp-from:latest
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

- [`src/components/Chatbot.tsx`](/Users/rex-shih/Documents/startup/SubNest_new/src/components/Chatbot.tsx)
- [`server.ts`](/Users/rex-shih/Documents/startup/SubNest_new/server.ts)
- [`public/chatbot-product-introduction.txt`](/Users/rex-shih/Documents/startup/SubNest_new/public/chatbot-product-introduction.txt)
- [`.env.example`](/Users/rex-shih/Documents/startup/SubNest_new/.env.example)
