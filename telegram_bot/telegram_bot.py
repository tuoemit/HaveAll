import logging
import os
import random
import asyncio
from typing import List
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
    CallbackQueryHandler,
)
from supabase import create_client, Client
from scrapper import monitor_and_sync

# Logs
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

# Credentials
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your-supabase-service-role-or-anon-key")
TELEGRAM_BOT_TOKEN = os.getenv("BOT_TOKEN", "YOUR_TELEGRAM_BOT_TOKEN")
ADMIN_TELEGRAM_IDS = [int(id_str.strip()) for id_str in os.getenv("ADMIN_IDS", "0").split(",") if id_str.strip().isdigit()]

# Supabase init
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Commands
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Home start menu with options."""
    keyboard = [
        [
            InlineKeyboardButton("🎯 Get MTProto Proxies", callback_data="get_proxies"),
            InlineKeyboardButton("⚡ Get V2Ray Configs (.txt)", callback_data="get_configs"),
        ],
        [
            InlineKeyboardButton("📊 Status", callback_data="status"),
            InlineKeyboardButton("🔄 Refresh DB (Admin Only)", callback_data="force_scrape"),
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        text=(
            "👋 **Welcome to ProxyHub Bot!**\n\n"
            "This bot automatically crawls top Telegram channels every 30 minutes for fresh, "
            "v2ray-like protocols (VLESS, VMess, Shadowsocks, Hysteria) and MTProto proxy configurations. "
            "All elements are synced directly into **Supabase database**.\n\n"
            "Select an action below:"
        ),
        reply_markup=reply_markup,
        parse_mode="Markdown"
    )

async def button_click_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handles inline query buttons (Get proxies, configs, status, force scrape)."""
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id
    data = query.data

    if data == "get_proxies":
        # Fetch up to 20 random fresh proxies from supabase
        try:
            res = supabase.table("proxies").select("*").limit(100).execute()
            all_proxies = res.data
            if not all_proxies:
                await query.edit_message_text(
                    text="❌ No proxies found in Supabase. Admin should run /scrape or add monitored channels.",
                    reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Back to Main", callback_data="back_main")]])
                )
                return

            # Random 20 or maximum available
            sample_size = min(20, len(all_proxies))
            selected = random.sample(all_proxies, sample_size)

            # Build markdown message showing buttons to easily add proxy directly to telegram
            # Like the user requested, showing them elegantly as interactive buttons!
            keyboard = []
            msg_text = "🟢 **Fresh MTProto Proxies (Random 20 Selected):**\n\n"
            for idx, p in enumerate(selected, 1):
                msg_text += f"{idx}. 📡 `Server:` {p['server']}\n   🔌 `Port:` {p['port']}\n   🔑 `Secret:` {p['secret']}\n\n"
                # Connect buttons (max 2 per row)
                if len(keyboard) == 0 or len(keyboard[-1]) >= 2:
                    keyboard.append([])
                keyboard[-1].append(InlineKeyboardButton(f"🔌 Connect Prx {idx}", url=p['tg_link']))

            keyboard.append([InlineKeyboardButton("🔙 Back to Main", callback_data="back_main")])
            await query.edit_message_text(
                text=msg_text,
                reply_markup=InlineKeyboardMarkup(keyboard),
                parse_mode="Markdown"
            )
        except Exception as e:
            logger.error(f"Error fetching proxies: {e}")
            await query.edit_message_text("❌ Database query error. Ensure Supabase credentials are set correctly.")

    elif data == "get_configs":
        # Select all configs from database and save into .txt config file bundle
        try:
            res = supabase.table("configs").select("*").limit(200).execute()
            all_configs = res.data
            if not all_configs:
                await query.edit_message_text(
                    text="❌ No Configs found in the database. Run /scrape to update.",
                    reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Back to Main", callback_data="back_main")]])
                )
                return

            # Gather raw contents
            configs_raw = [entry["raw_content"] for entry in all_configs]
            file_content = "\n\n".join(configs_raw)
            file_path = "ProxyHub_V2ray_Configs.txt"

            with open(file_path, "w", encoding="utf-8") as f:
                f.write(file_content)

            # Send document to user
            await query.message.reply_document(
                document=open(file_path, "rb"),
                filename=file_path,
                caption=f"⚡ Attached are **{len(all_configs)}** fresh configs fetched directly from monitored channels! (VLESS/VMess/SS/Hysteria/Trojan)\nAdd them to your favorite app (e.g. Hiddify, v2rayNG)."
            )
            # Remove file local
            if os.path.exists(file_path):
                os.remove(file_path)

        except Exception as e:
            logger.error(f"Error sending configs text: {e}")
            await query.edit_message_text(f"❌ Error generating configs bundle: {e}")

    elif data == "status":
        try:
            ch_count = len(supabase.table("monitored_channels").select("*").execute().data)
            px_count = len(supabase.table("proxies").select("id").execute().data)
            cf_count = len(supabase.table("configs").select("id").execute().data)

            await query.edit_message_text(
                text=(
                    f"📊 **ProxyHub Database Stats:**\n\n"
                    f"📡 Monitored Telegram Channels: **{ch_count}**\n"
                    f"🔌 Active MTProto Proxies: **{px_count}**\n"
                    f"⚡ Premium Configs: **{cf_count}**\n\n"
                    "Automated refresh runs every **30 minutes**."
                ),
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Back to Main", callback_data="back_main")]]),
                parse_mode="Markdown"
            )
        except Exception as e:
            await query.edit_message_text(f"❌ Status error: {e}")

    elif data == "force_scrape":
        # Check if user is admin
        if user_id not in ADMIN_TELEGRAM_IDS:
            await query.answer("❌ This action is restricted to Administrators only!", show_alert=True)
            return

        await query.edit_message_text("🔄 Scraping and Database refresh in progress... Please wait.")
        try:
            # Trigger scraped sync task safely
            await monitor_and_sync()
            await query.edit_message_text(
                text="✅ Database rebuilt successfully with the latest MTProto proxies and VPN configs!",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Back to Main", callback_data="back_main")]])
            )
        except Exception as e:
            await query.edit_message_text(f"❌ Scraping task failed: {e}")

    elif data == "back_main":
        keyboard = [
            [
                InlineKeyboardButton("🎯 Get MTProto Proxies", callback_data="get_proxies"),
                InlineKeyboardButton("⚡ Get V2Ray Configs (.txt)", callback_data="get_configs"),
            ],
            [
                InlineKeyboardButton("📊 Status", callback_data="status"),
                InlineKeyboardButton("🔄 Refresh DB (Admin Only)", callback_data="force_scrape"),
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(
            text="👋 **ProxyHub Main Menu:**\nSelect what you would like to retrieve:",
            reply_markup=reply_markup,
            parse_mode="Markdown"
        )

# ADMIN CRUD commands for channels
async def add_channel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Inserts a channel username to the database."""
    user_id = update.effective_user.id
    if user_id not in ADMIN_TELEGRAM_IDS:
        await update.message.reply_text("❌ Admin action only!")
        return

    if not context.args:
        await update.message.reply_text("✍️ Use format: `/addchannel [channel_username_without_@]` (e.g., /addchannel Masir_Sefid)")
        return

    ch_name = context.args[0].replace("@", "").strip()
    try:
        supabase.table("monitored_channels").insert({"username": ch_name}).execute()
        await update.message.reply_text(f"✅ Added channel `@{ch_name}` to monitored list. Execute /scrape to reload.")
    except Exception as e:
        await update.message.reply_text(f"❌ Failed to insert. Might already be registered? (Error: {e})")

async def remove_channel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Removes monitored channels from database."""
    user_id = update.effective_user.id
    if user_id not in ADMIN_TELEGRAM_IDS:
        await update.message.reply_text("❌ Admin action only!")
        return

    if not context.args:
        await update.message.reply_text("✍️ Use format: `/removechannel [channel_username]`")
        return

    ch_name = context.args[0].replace("@", "").strip()
    try:
        supabase.table("monitored_channels").delete().eq("username", ch_name).execute()
        await update.message.reply_text(f"✅ Removed channel `@{ch_name}` successfully.")
    except Exception as e:
        await update.message.reply_text(f"❌ Deletion error: {e}")

async def list_channels(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Lists current channels monitored."""
    user_id = update.effective_user.id
    if user_id not in ADMIN_TELEGRAM_IDS:
        await update.message.reply_text("❌ Admin action only!")
        return

    try:
        res = supabase.table("monitored_channels").select("*").execute()
        channels = [row["username"] for row in res.data]
        if not channels:
            await update.message.reply_text("📋 No channels configured.")
            return

        text = "📋 **Monitored Telegram Channels:**\n\n"
        for idx, ch in enumerate(channels, 1):
            text += f"{idx}. `@{ch}`\n"
        await update.message.reply_text(text, parse_mode="Markdown")
    except Exception as e:
        await update.message.reply_text(f"❌ Database error: {e}")

async def run_scraper_task(context: ContextTypes.DEFAULT_TYPE) -> None:
    """Recurring cron run scraper task directly."""
    logger.info("Executing recurring 30-minute scrape and database update...")
    try:
        await monitor_and_sync()
        logger.info("Recurring scape job done!")
    except Exception as e:
        logger.error(f"Cron check failed: {e}")

# Application Entry Point
def main():
    if not TELEGRAM_BOT_TOKEN:
        print("CRITICAL ERROR: BOT_TOKEN is missing!")
        return

    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()

    # Callback commands
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("addchannel", add_channel))
    app.add_handler(CommandHandler("removechannel", remove_channel))
    app.add_handler(CommandHandler("channels", list_channels))
    app.add_handler(CallbackQueryHandler(button_click_handler))

    # Add 30 minutes interval job
    job_queue = app.job_queue
    job_queue.run_repeating(run_scraper_task, interval=1800, first=10)

    print("🤖 ProxyHub Telegram Bot running successfully with 30-min scraper service.")
    app.run_polling()

if __name__ == "__main__":
    main()
