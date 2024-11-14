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
    -d '{"url": "https://assuring-woodcock-seemingly.ngrok-free.app/webhook"}'

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

## Telegram Bot

Make sure the following commands have been configured for the Walkshop Bot using `@BotFather` with the command `/setcommands`:

```
join - Join a Walkshop
create - Create a new Walkshop
```


## Implementation steps

### Datawalk Bot
Participants of Datawalkshop use their Telegram app to communicate with the Datawalk Bot. Via the Bot, they can join a workshop and contribute data points.

Connection with Telegram
*   Walkshop Bot - Setup using `@BotFather` [DONE]
*   [Telegram Bot API](https://core.telegram.org/bots/api) connection - With [node-telegram-bot-api](https://www.npmjs.com/package/node-telegram-bot-api) + webhook/ngrok [DONE]
*   Telegram Bot messages - Via Bot library in `bot.ts`, e.g. `bot.on("photo")` [DONE]

Command handling (see `bot.ts`)
*   Commands
    *   `/create`
    *   `/join` 
    *   `/status`
    *   `/leave`
    *   `/list`
*   Media
    * Photo
        * Save to filesystem (JPEG) [DONE]
    * Video 
        * Save to filesystem (MP4/MOV) [DONE]
    * Voice message
        * Saved to filesystem (MP3, voice recordings as OGA, Ogg Vorbis Audio File [DONE]
* Location
    * Location [DONE]
    * Live location [DONE]

Data
*   Save to filesystem 
*   Save to database

### Datawalk Map
To see the routes and results of a Datawalkshop, participants can reflect on the Datawalk Map. This web-based tool shows the collected data. 

Datawalk visualisation
*   Map -- https://dev.to/samuelearl/building-a-geospacial-app-with-sveltekit-deckgl-and-mapbox-part-1-start-with-a-map-59lh

### Ideas

*   Sharing collected items in Telegram Group (requires attaching Datawalk Bot to this channel)
