import smtplib, os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from config import IMAP_EMAIL as GMAIL_USER, IMAP_PASSWORD as GMAIL_APP_PASS

def send_mail_with_attachment(to_addr: str, subject: str, body: str, filepath: str):
    msg = MIMEMultipart()
    msg['From'] = GMAIL_USER
    msg['To'] = to_addr
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))
    if filepath and os.path.exists(filepath):
        part = MIMEBase('application', 'octet-stream')
        with open(filepath, 'rb') as f:
            part.set_payload(f.read())
        encoders.encode_base64(part)
        part.add_header('Content-Disposition', f'attachment; filename="{os.path.basename(filepath)}"')
        msg.attach(part)
    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(GMAIL_USER, GMAIL_APP_PASS)
        server.sendmail(GMAIL_USER, [to_addr], msg.as_string())
        server.quit()
        print("Email enviado a", to_addr)
    except Exception as e:
        print("Error enviando email:", e)
