# Inmuebles Monitor (Render.com) — Paquete todo en uno

Este paquete ya viene configurado con tus datos y funciona 24/7 en **Render.com** sin tocar tu ordenador.

## Qué hace
- Lee **alertas por email** de los portales (usa la cuenta Gmail que nos diste).
- Filtra por **particulares** cuando el correo lo indica y por zona: **46111, 46110, Moncada, Valencia**.
- Te manda los **nuevos anuncios por Telegram**.
- Genera un **Excel** `anuncios_export.xlsx` y te lo envía por **Gmail** cada día a las **06:00 UTC**.

## Despliegue paso a paso (solo con el navegador)
1. Crea una cuenta en **github.com** (si no tienes).
2. Pulsa **New repository**. Nombre: `inmuebles-monitor`. Marca **Private** si quieres.
3. Entra al repositorio y pulsa **Add file → Upload files**. Arrastra **todo el contenido de este ZIP** (no subas el ZIP, sube los archivos por dentro).
4. Pulsa **Commit changes**.

5. Crea cuenta en **render.com** e inicia sesión.
6. Pulsa **New +** y elige **Background Worker**.
7. Conecta tu cuenta de **GitHub** y elige el repositorio `inmuebles-monitor`.
8. Render detectará Python. Comprueba:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`
   - **Plan**: Free
9. Pulsa **Create Web Service** o **Create Worker**. Espera a que construya y arranque.

Listo. Cuando lleguen alertas a tu Gmail, el bot te enviará los anuncios por Telegram y el Excel se actualizará a diario y te llegará por correo.

## Notas
- Si quieres cambiar la zona o la hora del informe, edita `config.py` en GitHub y Render lo redeployará solo.
- Este método usa **alertas por email** para respetar términos de uso. Añade y ajusta alertas en los portales usando tu Gmail. 

