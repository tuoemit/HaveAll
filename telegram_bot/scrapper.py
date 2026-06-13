import re
import os
import asyncio
from datetime import datetime
import httpx
from supabase import create_client, Client

# Supabase Credentials
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your-supabase-service-role-or-anon-key")

# Set up Supabase Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Regex Patterns for Proxies (MTProto)
# tg://proxy?server=apex.proxytop.space&port=443&secret=ee05d3d7463edfb7...
# t.me/proxy?server=...
# Supports both pure & and HTML-encoded &amp;
MTPROTO_RE = re.compile(
    r"(?:tg|https?://t\.me)/proxy\?server=([a-zA-Z0-9\.\-_]+)&(?:amp;)?port=(\d+)&(?:amp;)?secret=([a-zA-Z0-9\-_]+)"
)

# Regex Patterns for V2Ray / Shadowsocks / Hysteria / Vless / VMess / Trojan
CONFIG_RE = re.compile(
    r"\b((?:vmess|vless|ss|ssr|trojan|hysteria|hysteria2|tuic)://[^\s\"'<>]+)"
)

async def clear_database_and_fetch_channels():
    """Reads latest channels to monitor from Supabase, then clears old configs/proxies so we can insert fresh ones."""
    try:
        # Get monitored channels from Supabase
        response = supabase.table("monitored_channels").select("username").execute()
        channels = [row["username"] for row in response.data]
        if not channels:
            # Fallback seed channels if database is empty
            channels = ["ProxyMTProto", "Masir_Sefid", "v2ray_outlinefree"]
            for ch in channels:
                try:
                    supabase.table("monitored_channels").insert({"username": ch}).execute()
                except Exception as e:
                    print(f"Skipped inserting channel seed: {e}")
        return channels
    except Exception as e:
        print(f"Error accessing Supabase monitored_channels: {e}")
        return ["ProxyMTProto", "Masir_Sefid"]

async def wipe_prev_data():
    """Wipes existing proxy and config tables to ensure fresh non-expired options."""
    try:
        # Delete existing data (Supabase allow delete with true condition or matching all)
        supabase.table("proxies").delete().neq("id", 0).execute()
        supabase.table("configs").delete().neq("id", 0).execute()
        print("Successfully cleared database to receive fresh elements.")
    except Exception as e:
        print(f"Wiping existing Supabase records failed: {e}")

async def monitor_and_sync():
    """Fetches public preview telegram pages to scrape and update Supabase."""
    print("Initializing Telegram Scraper...")
    channels = await clear_database_and_fetch_channels()
    await wipe_prev_data()

    configs_extracted = []
    proxies_extracted = []

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=15.0) as client:
        for channel in channels:
            url = f"https://t.me/s/{channel}"
            print(f"Fetching public channel view: {url}")
            try:
                response = await client.get(url)
                if response.status_code != 200:
                    print(f"Could not load channel preview for @{channel} (HTTP {response.status_code})")
                    continue

                html = response.text

                # Parse MTProto Proxies
                for server, port, secret in MTPROTO_RE.findall(html):
                    # Clean any trailing HTML clutter
                    server_clean = server.strip()
                    port_clean = port.strip()
                    secret_clean = secret.strip()
                    tg_link = f"https://t.me/proxy?server={server_clean}&port={port_clean}&secret={secret_clean}"
                    
                    if tg_link not in [p["tg_link"] for p in proxies_extracted]:
                        proxies_extracted.append({
                            "server": server_clean,
                            "port": int(port_clean),
                            "secret": secret_clean,
                            "tg_link": tg_link
                        })

                # Parse regular V2Ray/VLess/VMess configs
                for config in CONFIG_RE.findall(html):
                    # Clean trailing HTML codes/quotes
                    config_clean = config.replace("&amp;", "&").split('"')[0].split("'")[0].split("<")[0].strip()
                    
                    # Classify standard type
                    config_type = "vmess"
                    lower_conf = config_clean.lower()
                    if "vless://" in lower_conf:
                        config_type = "vless"
                    elif "ss://" in lower_conf:
                        config_type = "shadowsocks"
                    elif "hysteria" in lower_conf:
                        config_type = "hysteria"
                    elif "trojan://" in lower_conf:
                        config_type = "trojan"
                    elif "tuic://" in lower_conf:
                        config_type = "tuic"

                    remarks = f"Fetched from @{channel} at {datetime.now().strftime('%Y-%m-%d')}"

                    if config_clean not in [c["raw_content"] for c in configs_extracted]:
                        configs_extracted.append({
                            "type": config_type,
                            "raw_content": config_clean,
                            "remarks": remarks
                        })

            except Exception as e:
                print(f"Error scraping channel @{channel}: {e}")

    # Push to Supabase if any found
    if proxies_extracted:
        try:
            print(f"Saving {len(proxies_extracted)} proxies to Supabase...")
            supabase.table("proxies").insert(proxies_extracted).execute()
        except Exception as e:
            print(f"Error inserting proxies to Supabase: {e}")

    if configs_extracted:
        try:
            print(f"Saving {len(configs_extracted)} configs to Supabase...")
            supabase.table("configs").insert(configs_extracted).execute()
        except Exception as e:
            print(f"Error inserting configs to Supabase: {e}")

    print("Scraping iteration finished.")

if __name__ == "__main__":
    asyncio.run(monitor_and_sync())
