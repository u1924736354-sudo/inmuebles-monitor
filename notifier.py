from telegram import Bot
from config import TELEGRAM_TOKEN, TELEGRAM_CHAT_ID

def notify_telegram(text: str):
    try:
        Bot(token=TELEGRAM_TOKEN).send_message(chat_id=TELEGRAM_CHAT_ID, text=text, disable_web_page_preview=True)
    except Exception as e:
        print("Telegram error:", e)

def send_photo_with_caption(photo_url: str, caption: str):
    try:
        Bot(token=TELEGRAM_TOKEN).send_photo(chat_id=TELEGRAM_CHAT_ID, photo=photo_url, caption=caption)
    except Exception as e:
        print("Telegram photo error:", e)
        notify_telegram(caption)
