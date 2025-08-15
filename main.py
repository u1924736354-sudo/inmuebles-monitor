import time, pandas as pd
from datetime import datetime, timezone
from apscheduler.schedulers.blocking import BlockingScheduler

from config import POSTAL_CODES, CITIES, CHECK_INTERVAL_MINUTES, EXPORT_PATH, DAILY_REPORT_UTC, IMAP_EMAIL
from notifier import notify_telegram, send_photo_with_caption
from exporter import export_to_excel
from email_tools import fetch_alert_emails
from mailer import send_mail_with_attachment

# En este ejemplo nos apoyamos en alertas por email (vía IMAP).
# Si se integran más fuentes o APIs oficiales, se añadirían aquí.

def check_new_listings():
    print("Comprobando alertas por email...")
    anuncios = fetch_alert_emails()
    if not anuncios:
        print("Sin novedades por email esta pasada.")
        return
    # Filtro básico por CP/Ciudad si están presentes
    filtrados = []
    for a in anuncios:
        ok_cp = (not a.get('cp')) or (a.get('cp') in POSTAL_CODES)
        ok_city = (not a.get('ciudad')) or (a.get('ciudad') in CITIES)
        if ok_cp and ok_city:
            filtrados.append(a)
    if not filtrados:
        print("No hubo anuncios que cumplan el filtro geográfico.")
        return
    # Notificar y exportar
    df = pd.DataFrame(filtrados)
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
        # Intentar enviar foto si hay urls de imagen
        fotos = a.get("fotos") or []
        if fotos:
            try:
                send_photo_with_caption(fotos[0], caption)
            except Exception:
                notify_telegram(caption)
        else:
            notify_telegram(caption)
    print(f"Procesados y notificados {len(filtrados)} anuncios.")

def send_daily_report():
    # Enviar el Excel por email una vez al día
    now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    subject = f"Informe diario inmuebles - {now}"
    body = "Adjunto el Excel con los anuncios detectados hoy."
    try:
        send_mail_with_attachment(IMAP_EMAIL, subject, body, EXPORT_PATH)
    except Exception as e:
        print("Fallo enviando informe diario:", e)

def main():
    sched = BlockingScheduler(timezone="UTC")
    sched.add_job(check_new_listings, "interval", minutes=CHECK_INTERVAL_MINUTES, next_run_time=None)
    # Programar informe diario
    hh, mm = DAILY_REPORT_UTC.split(":")
    sched.add_job(send_daily_report, "cron", hour=int(hh), minute=int(mm))
    print("Monitor en ejecución 24/7. Ctrl+C para salir.")
    sched.start()

if __name__ == "__main__":
    main()
