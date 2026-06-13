# 🌌 HaveAll (همه برای تو): Multi-Source VPN Config Scraper & Client Engine 🫧

HaveAll (همه برای تو) is a fully-automated, offline-first connectivity toolkit spanning an ultra-high speed scraping Telegram bot and a modern responsive Android application. Powered by Supabase, the system curates zero-latency network tunnel configurations and MTProto proxy servers to bypass censorship with single-tap fluidity.

---

## 🤖 Telegram Scraper Bot (@HaveAllBot)
The Telegram bot acts as the automated scraping and administrative brain of the system:
- **Automatic 30-Minute Sync**: Every 30 minutes, the bot runs a synchronized crawler over official, high-quality GitHub subscription sources and specified crawlable Telegram proxy channels.
- **Protocol Scraper & Decoder**: Handles complex formats including manual YAML parser arrays and base64-encoded subscription strings for standard protocols (`vless`, `vmess`, `shadowsocks`, `hysteria`, `trojan`).
- **Dynamic Group Broadcast Alert**: Automatically saves every telegram group ID it joins and broadcasts beautiful, glassmorphic network update announcements on every scraper completion cycle.
- **Administrative Command Portal**:
  - `/start` - Access the responsive main keyboard dashboard.
  - `/scrape` - Triggers an immediate manual network sync bypassing the timer.
  - `/addchannel [username]` - Registers custom Telegram proxy channels directly into the centralized Supabase database.
  - `/removechannel [username]` - Revokes monitored custom channel access.
- **Glassmorphic Interactive Messages**:
  - **MTProto Proxies Selector**: Outputs a clean "enjoy" greeting containing zero raw IP metadata with a layout grid of sleek "have?" buttons pointing to connecting proxy schemes.
  - **150 Configs Bundle**: Randomly mixes and exports exactly 150 elite VPN tunnel subscription nodes inside a cleanly generated `.txt` file for direct import.

---

## 📱 Jetpack Compose Android Client App
A stunning, space-themed Material 3 client application built natively to retrieve and import nodes:
1. **Adaptive Glassmorphic Layout**: Implements translucent glass panels, neon blue/cyan gradients, and smooth spring-based transitions for high surface contrast.
2. **Language Toggle Switch (English & Farsi)**: Includes a global title banner, tabs, labels, and helper descriptions instantly localized to and from native Farsi.
3. **Advanced Farsi Fonts pairing**: Includes native Vazirmatn downloadable typography for Persian layouts, beautifully paired with Outfit headings for standard English indicators.
4. **Interactive Channel Pool Admin Console**:
  - Administrators can directly manage monitored channel usernames with simple edit text fields and custom insertions updating the PostgREST Supabase pool on form submit.
  - Dynamic removal triggers delete queries smoothly, keeping caches aligned.
5. **Low-Latency Connectors**:
  - **One-Tap Proxy Joiner**: Launches system intents directly into active Telegram client instances to register proxy connections.
  - **One-Tap Hiddify Config Import**: Encodes and injects raw tunnel nodes into Hiddify or alternative client apps via direct URI application schema triggers.
  - **Compact 20-Node Paginess**: Displays exactly 20 items per paginated layout to optimize cellular byte usage.

---

## ⚙️ Configuration Setup
To initialize the cluster locally or in cloud container hosting, save the credentials below inside your `.env` workspace:
`BOT_TOKEN`=Your_Telegram_Token_From_BotFather  
`ADMIN_IDS`=Comma_Separated_Admin_Chat_IDs_Example_5196798256  
`SUPABASE_URL`=https://your-project.supabase.co  
`SUPABASE_KEY`=your-secret-anon-or-service-role-key  

***Enjoy pristine, zero-throttle networking with style!*** 🧊💎
