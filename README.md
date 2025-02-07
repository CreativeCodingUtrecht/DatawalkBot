# DatawalkBot
Telegram bot-based data collection tool designed for workshop participants engaging in a datawalk.

## Telegram Bot

Create your own Datawalk Bot using `@BotFather`. Make sure the following commands have been configured for the Datawalk Bot using `@BotFather` with the command `/setcommands`:

```
start - Let's get to know me! 👋
join - Join Datawalk
create - Create new Datawalk
status - Find out which Datawalk you're currently in
leave - Leave current Datawalk
list - List active Datawalks
```

## Datawalk Application

Install dependencies with `yarn` (or `npm install` or `pnpm install`) in the `app` folder, start a development server:

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

Then, set this static domain as the Webhook URL in the Telegram Bot (replace `$(BOT_TOKEN)` with your own Telegram BOT API token). 

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

### Datawalk Bot webhook handling
Participants of Datawalkshop use their Telegram app to communicate with the Datawalk Bot. Via the Bot, they can join a workshop and contribute data points.

Connection with Telegram
*   Walkshop Bot - Setup using `@BotFather` [DONE]
*   [Telegram Bot API](https://core.telegram.org/bots/api) connection - With [node-telegram-bot-api](https://www.npmjs.com/package/node-telegram-bot-api) + webhook/ngrok [DONE]
*   Telegram Bot messages - Via Bot library in `bot.ts`, e.g. `bot.on("photo")` [DONE]

Command handling (see `bot.ts`)
*   Commands
    *   `/create` - Create a new Datawalk
    *   `/join [code]` - Join an existing Datawalk with `code`
    *   `/status` - Get information the Datawalk you're currently participating in
    *   `/leave` - Leave the Datawalk you're currently participating in
    *   `/list` - List all available Datawalks
    *   `/archive [code]` - Archive/unarchive a Datawalk with `code`
    *   `/name` - Rename the Datawalk you're currently participating in
*   Media
    * Photo
        * Save to filesystem (JPEG) [DONE]
    * Video 
        * Save to filesystem (MP4/MOV) [DONE]
    * Audio and Voice message
        * Saved to filesystem (MP3, voice recordings as OGA, Ogg Vorbis Audio File [DONE]
* Location
    * Location [DONE]
    * Live location [DONE] -- enable live location sharing for automatic geotagging of uploaded media

### Datawalk Map
To see the routes and results of a Datawalkshop, participants can reflect on the Datawalk Map. This web-based tool shows the collected data. 

Datawalk visualisation
*   Map [DONE]

### Known issues

High prio issues:
*   Ask participant the Datawalk to join when they only typed the command `/join` instead of `/join [code]`
*   Geotag multiple media files at once - currently only the last available media file is geotagged when a GPS location is received by the app.
*   Save video messages (option available under the voice message icon) - currently these videos are not recognized and stored

CCU Playtest notes (2024-11-21) can be found [here](https://www.notion.so/creativecodingutrecht/Datawalk-Bot-Playtest-19c57c3a94b946e29e81740f86280c51?pvs=4) (document is not public).