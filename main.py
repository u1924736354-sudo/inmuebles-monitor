import pandas as pd
from datetime import datetime, timezone
from apscheduler.schedulers.blocking import BlockingScheduler

from config import POSTAL_CODES, CITIES, CHECK_INTERVAL_MINUTES, EXPORT_PATH, DAILY_REPORT_UTC, IMAP_EMAIL
from notifier import notify_telegram, send_photo_with_caption
from exporter import export_to_excel
from email_tools import fetch_alert_emails
from mailer import send_mail_with_attachment

def check_new_listings():
    print("Comprobando alertas por email...")
    anuncios = fetch_alert_emails()
    if not anuncios:
        print("Sin novedades por email esta pasada.")
        return
    filtrados = []
    for a in anuncios:
        ok_cp = (not a.get('cp')) or (a.get('cp') in POSTAL_CODES)
        ok_city = (not a.get('ciudad')) or (a.get('ciudad') in CITIES)
        if ok_cp and ok_city and a.get('es_particular'):
            filtrados.append(a)
    if not filtrados:
        print("No hubo anuncios que cumplan el filtro geográfico y de particular.")
        return
    df = pandas.DataFrame(filtrados)

    try:
        export_to_excel(df, EXPORT_PATH)
    except Exception as e:
        print("Fallo exportando Excel:", e)
    for a in filtrados:
        caption = f"Nuevo anuncio: {a.get('titulo') or 'sin título'}\n{a.get('url')}"
        if a.get("precio"):
            caption += f"\nPrecio: {a['precio']}"
        if a.get("ciudad"):
            caption += f"\nCiudad: {a['ciudad']}"
        fotos = a.get("fotos") or []
        if fotos:
            try:
                send_photo_with_caption(fotos[0], caption)
            except Exception:
                notify_telegram(caption)
        else:
            notify_telegram(caption)
    print(f"Procesados y notificados {{len(filtrados)}} anuncios.")

def send_daily_report():
    now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    subject = f"Informe diario inmuebles - {now}"
    body = "Adjunto el Excel con los anuncios detectados hoy."
    try:
        send_mail_with_attachment(IMAP_EMAIL, subject, body, EXPORT_PATH)
    except Exception as e:
        print("Fallo enviando informe diario:", e)

def main():
    try:
        notify_telegram("Bot arrancado en Render/Railway. Monitor activo ✅")
    except Exception as e:
        print("No se pudo enviar notificación de arranque:", e)

    sched = BlockingScheduler(timezone="UTC")
    # ejecutar inmediatamente y luego cada X minutos
    sched.add_job(check_new_listings, "interval", minutes=CHECK_INTERVAL_MINUTES, next_run_time=datetime.now(timezone.utc))
    hh, mm = DAILY_REPORT_UTC.split(":")
    sched.add_job(send_daily_report, "cron", hour=int(hh), minute=int(mm))
    print("Monitor en ejecución 24/7. Ctrl+C para salir.")
    sched.start()

if __name__ == "__main__":
    main()
