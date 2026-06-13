#!/usr/bin/env bash

# =========================================================================
# SYSTEM STARTUP & ORCHESTRATION SCRIPT
# Installs UV, configures dependencies, prompts for keys, and boots the Bot.
# =========================================================================

set -e

echo "🚀 Booting HaveAll Bot initialization..."

# 1. Install curl if not available
if ! command -v curl &> /dev/null; then
    echo "📦 System package curl missing. Please install manually."
fi

# 2. Check & Install uv (Fast python package manager by Astral)
if ! command -v uv &> /dev/null; then
    echo "💾 Installing UV Package Manager (astral-sh/uv)..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    # Source local paths
    export PATH="$HOME/.local/bin:$PATH"
    if [ -f "$HOME/.cargo/env" ]; then
        source "$HOME/.cargo/env"
    fi
else
    echo "✅ UV Package Manager already installed!"
fi

# 3. Interactive Environment Setup
ENV_FILE="telegram_bot/.env"

if [ ! -f "$ENV_FILE" ] && [ ! -f "telegram_bot/.env" ]; then
    echo "⚙️  No configuration profile detected. Let's set up your keys interactively!"
    
    # Prompt for Telegram Bot Token
    echo "✍️  Please enter your Telegram Bot API Token (from @BotFather):"
    read -r user_bot_token
    
    # Prompt for Admin Telegram Chat ID(s)
    echo "👤 Please enter your Telegram Admin Chat ID (e.g. 524021021. You can find this using @UserInfoBot on Telegram):"
    read -r user_admin_ids
    
    # Prompt for Supabase URL
    echo "📡 Please enter your Supabase Project URL (e.g. https://your-project.supabase.co):"
    read -r user_supabase_url
    
    # Prompt for Supabase Key
    echo "🔑 Please enter your Supabase Admin/Anon key:"
    read -r user_supabase_key

    # Writing config safely to .env
    cat <<EOF > "telegram_bot/.env"
BOT_TOKEN=$user_bot_token
ADMIN_IDS=$user_admin_ids
SUPABASE_URL=$user_supabase_url
SUPABASE_KEY=$user_supabase_key
EOF
    echo "✅ Configuration successfully saved to telegram_bot/.env!"
else
    echo "✅ Existing configuration profile detected."
fi

# Load the environment keys automatically for the current execution shell
if [ -f "telegram_bot/.env" ]; then
    echo "⚙️  Loading configurations..."
    # Read line-by-line avoiding compatibility errors with source
    while IFS='=' read -r key value || [ -n "$key" ]; do
        # Ignore comments & empty lines
        if [[ ! "$key" =~ ^# ]] && [[ -n "$key" ]]; then
            # Strip quotes if any
            clean_val=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
            export "$key=$clean_val"
        fi
    done < "telegram_bot/.env"
fi

echo "📦 Creating virtual environment and installing python dependencies using UV..."
# 4. Use uv to create clean environment and sync python libraries
# If virtual environment doesn't exist, build it
if [ ! -d ".venv" ]; then
    uv venv .venv
fi
source .venv/bin/activate

# 5. Install required libraries (Telethon removed entirely!)
uv pip install \
    python-telegram-bot[job-queue]==21.3 \
    supabase==2.5.0 \
    httpx==0.27.0

# 6. Booting the actual bot daemonizer
echo "🤖 Starting HaveAll Telegram Bot service..."
python telegram_bot/telegram_bot.py

