import imaplib, email, re
from typing import List, Dict
from config import IMAP_SERVER, IMAP_EMAIL, IMAP_PASSWORD, CITIES

URL_RE = re.compile(r"https?://[\w\-\.\?\=\/#%&:+]+", re.I)
CP_RE = re.compile(r"\b(46[0-9]{{3}})\b")

def parse_email_for_listings(msg_body: str) -> List[Dict]:
    urls = URL_RE.findall(msg_body or "")
    cp_found = CP_RE.findall(msg_body or "")
    cp = cp_found[0] if cp_found else ""
    ciudad = ""
    mlower = (msg_body or "").lower()
    for c in CITIES:
        if c.lower() in mlower:
            ciudad = c
            break
    es_particular = any(k in mlower for k in ["particular","venta por particular","propietario"])
    anuncios = []
    for u in urls:
        anuncios.append({
            "portal": "email-alert",
            "id_portal": u[:64],
            "url": u,
            "titulo": "",
            "precio": "",
            "cp": cp,
            "ciudad": ciudad,
            "es_particular": es_particular,
            "tipo": "vivienda",
            "fotos": [],
            "descripcion": ""
        })
    return anuncios

def fetch_alert_emails() -> list:
    if not IMAP_EMAIL or not IMAP_PASSWORD:
        print("IMAP no configurado; se omiten alertas por email.")
        return []
    mail = imaplib.IMAP4_SSL(IMAP_SERVER)
    mail.login(IMAP_EMAIL, IMAP_PASSWORD)
    mail.select("INBOX")
    status, data = mail.search(None, '(UNSEEN)')
    results = []
    if status != "OK":
        mail.logout()
        return results
    for num in data[0].split():
        status, msg_data = mail.fetch(num, '(RFC822)')
        if status != "OK":
            continue
        msg = email.message_from_bytes(msg_data[0][1])
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                ctype = part.get_content_type()
                disp = str(part.get('Content-Disposition'))
                if ctype == 'text/plain' and 'attachment' not in disp:
                    body = part.get_payload(decode=True).decode(errors='ignore')
                    break
                elif ctype == 'text/html' and not body:
                    body = part.get_payload(decode=True).decode(errors='ignore')
        else:
            body = msg.get_payload(decode=True).decode(errors='ignore')
        resultados = parse_email_for_listings(body)
        results.extend(resultados)
        # marcar visto
        mail.store(num, '+FLAGS', '\\Seen')
    mail.logout()
    return results
