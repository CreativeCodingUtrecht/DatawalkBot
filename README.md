# DatawalkBot
Telegram bot-based data collection tool designed for workshop participants engaging in a datawalk

## Developing

Install dependencies with `yarn` (or `npm install` or `pnpm install`), start a development server:

```bash
yarn run dev

# or start the server and open the app in a new browser tab
yarn run dev -- --open
```

## Building

To create a production version of your app:

```bash
yarn run build
```

You can preview the production build with `yarn run preview`.

## Testing the Telegram Bot with ngrok

Get a free account on ngrok for testing. Claim your free static domain (e.g. `assuring-woodcock-seemingly.ngrok-free.app`).

Then, set this static domain as the Webhook URL in the Telegram Bot. 

```
curl -X POST https://api.telegram.org/bot$(BOT_TOKEN)/setWebhook \
    -H "Content-type: application/json" \
    -d '{"url": "https://assuring-woodcock-seemingly.ngrok-free.app"}'

# this should result in a success response such as:
{"ok":true,"result":true,"description":"Webhook was set"}
```

Start the development server to make it available on local port `5173`:

```
yarn run dev --host
```

And make the development server on port `5173` publically available using ngrok:

```
ngrok http --url=assuring-woodcock-seemingly.ngrok-free.app 5173

```