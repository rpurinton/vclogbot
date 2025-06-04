# vclogbot

A Discord bot for tracking and rewarding voice channel activity with a leveling system, join/leave messages, and interactive stats commands.

---

## Features

- **Voice Channel Leveling System**: Tracks user time spent in voice channels and awards levels based on total time.
- **Join/Leave Messages**: Announces when users join or leave voice channels, including late joins (e.g., after bot restarts or mute/unmute events).
- **/stats Command**: Shows your current level, total voice time, and progress to the next level.
- **/leaderboard Command**: Displays the top users in your server by voice channel activity.
- **Automatic Session Recovery**: Handles missed join events and bot restarts, ensuring accurate tracking.
- **Locale Support**: Easily add or edit language files in `src/locales/`.
- **Winston-based Logging**: Detailed debug and error logs for troubleshooting.
- **Systemd Service Template**: Ready for production deployment on Linux servers.

---

## Getting Started

### 1. Clone the repository

```sh
# Replace <your-username> and <your-repo> with your GitHub info
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### 2. Install dependencies

```sh
npm install
```

### 3. Configure environment

Copy `.env.example` to `.env` and fill in your settings:

```sh
cp .env.example .env
```

Edit the `.env` file:

```env
DISCORD_TOKEN=your-app-token
DISCORD_CLIENT_ID=your-client-id
DB_HOST=localhost
DB_USER=your-db-user
DB_PASS=your-db-password
DB_NAME=vclogbot
LOG_LEVEL=info
```

### 4. Run the bot

```sh
node vclogbot.mjs
```

---

## Usage

### Voice Channel Leveling

- Users earn experience by being in voice channels.
- Levels are calculated using a triangular formula (each level requires more time).
- Level-up messages are sent in the channel when a user advances.

### Join/Leave Messages

- The bot announces when users join or leave a voice channel.
- If the bot was offline or missed a join event, it will detect the user on the next relevant event (e.g., mute/unmute) and start tracking.

### Commands

- `/stats` — Shows your current level, total time, and progress.
- `/leaderboard` — Shows the top users by voice time in the server.

---

## Customization

- **Locales**: Add or edit JSON files in `src/locales/` for multi-language support.
- **Logging**: Set `LOG_LEVEL` in your `.env` (`debug`, `info`, `warn`, `error`).

---

## Systemd Service Setup

To run your app as a service on Linux, use the provided `vclogbot.service` file.

**Update the paths and names to match your project.**

Example `vclogbot.service`:

```ini
[Unit]
Description=vclogbot
After=network-online.target
Wants=network-online.target
StartLimitBurst=3
StartLimitIntervalSec=60

[Service]
User=appuser
Group=appgroup
RestartSec=5
Restart=on-failure
WorkingDirectory=/opt/vclogbot
ExecStart=/usr/bin/node /opt/vclogbot/vclogbot.mjs
EnvironmentFile=/opt/vclogbot/.env

[Install]
WantedBy=multi-user.target
```

**Instructions:**

1. Copy and rename the service file:

   ```sh
   sudo cp vclogbot.service /etc/systemd/system/myapp.service
   ```

2. Edit the service file:
   - Set `WorkingDirectory` and `ExecStart` to your app's location and main file (use absolute paths).
   - Set `EnvironmentFile` to your `.env` location.
   - Change `User` and `Group` to a non-root user for security.

3. Reload systemd and enable the service:

   ```sh
   sudo systemctl daemon-reload
   sudo systemctl enable myapp.service
   sudo systemctl start myapp.service
   sudo systemctl status myapp.service
   ```

---

## Folder Structure

```text
src/
  commands/      # Slash command definitions and handlers
  events/        # Event handlers (voice, message, etc.)
  locales/       # Locale JSON files
  custom/        # Leveling, timer, and utility logic
  *.mjs          # Core logic
```

---

## Best Practices

- **Keep your app token secret!** Never commit your `.env` file or token to version control.
- **Use a dedicated, non-root user** for running your app in production.
- **Monitor logs** for errors or unusual activity.
- **Check Discord.js documentation** for new features: [https://discord.js.org/](https://discord.js.org/)

---

## License

MIT

## Support

Email: <russell.purinton@gmail.com>
Discord: laozi101
