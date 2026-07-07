# Discord Widget Bot

Discord bot + Rich Presence app để hiển thị widget tùy chỉnh trên profile Discord.

## Features

- 🎮 **Rich Presence Widget** - Hiện "Playing [App]" với custom text + ảnh trên profile
- 🤖 **Discord Bot** - Quản lý widget qua slash commands
- 👥 **Multi-User** - Mỗi user có config riêng
- 🔄 **Auto Reload** - Config tự cập nhật khi thay đổi

## Installation

```bash
# Clone repo
git clone https://github.com/your-username/widget-bot.git
cd widget-bot

# Install dependencies
pnpm install
```

## Setup

### 1. Tạo Discord Bot

1. Vào [Discord Developer Portal](https://discord.com/developers/applications)
2. **New Application** > đặt tên
3. Vào **Bot** > **Reset Token** > copy token
4. Vào **OAuth2** > **URL Generator** > chọn `bot` + `applications.commands`
5. Invite bot vào server

### 2. Cấu hình

Tạo file `.env`:

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_app_id_here
```

### 3. Deploy Commands

```bash
node deploy-commands.js
```

### 4. Chạy Bot

```bash
node index.js
```

### 5. Chạy Rich Presence

```bash
# Dùng config mặc định
node rpc/index.js

# Dùng config của user cụ thể
node rpc/index.js USER_ID
```

## Commands

| Command | Mô tả |
|---------|--------|
| `/rpc-set` | Xem config hiện tại |
| `/rpc-set details:...` | Đổi dòng 1 |
| `/rpc-set state:...` | Đổi dòng 2 |
| `/rpc-set large-image:...` | Đổi ảnh lớn |
| `/rpc-set small-image:...` | Đổi ảnh nhỏ |
| `/rpc-set button1-label:... button1-url:...` | Thêm nút |

## Config Structure

```json
{
  "clientId": "YOUR_APP_ID",
  "details": "Rank: Member | Joined: 2022",
  "state": "Fav Game: Wuthering Waves",
  "largeImageKey": "image_name_or_url",
  "largeImageText": "Tooltip text",
  "smallImageKey": "icon_name_or_url",
  "smallImageText": "Tooltip text",
  "buttons": [
    { "label": "Spotify", "url": "https://..." },
    { "label": "GitHub", "url": "https://..." }
  ]
}
```

## Project Structure

```
WidgetBot/
├── index.js              # Main bot
├── deploy-commands.js    # Deploy slash commands
├── database.js           # JSON storage
├── commands/
│   ├── widget.js         # /widget command
│   ├── widget-setup.js   # /widget-setup command
│   └── rpc-set.js        # /rpc-set command
├── rpc/
│   ├── index.js          # Rich Presence app
│   └── config.json       # Default config
├── configs/              # Per-user configs
│   └── default.json
└── .env                  # Environment variables
```

## How It Works

1. User gõ `/rpc-set details:...` trong Discord
2. Bot lưu config vào `configs/{userId}.json`
3. RPC app detect file thay đổi → tự reload
4. Rich Presence cập nhật trên profile

## Notes

- **Buttons** chỉ hiện cho người khác xem, không hiện cho chính mình
- **Rich Presence** chỉ hoạt động trên Discord desktop client
- **Ảnh** có thể dùng URL hoặc asset name từ Developer Portal

## License

MIT
