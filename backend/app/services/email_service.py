"""
Email service — sends contact form submissions to admin via SMTP.
Reads credentials from environment variables (loaded via .env).
"""

import smtplib
import os
from email.message import EmailMessage
from dotenv import load_dotenv

# Explicitly load .env so this module works regardless of import order
load_dotenv(override=False)


def send_contact_email(name: str, sender_email: str, subject: str, message: str) -> dict:
    """
    Send a contact form email to the admin address.

    Required environment variables:
        SMTP_SERVER          e.g. smtp.gmail.com
        SMTP_PORT            e.g. 587
        SMTP_EMAIL           sender account (app email)
        SMTP_PASSWORD        sender account password / app password
        CONTACT_RECEIVER_EMAIL  admin inbox to receive the message
    """
    smtp_server = os.getenv("SMTP_SERVER", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_email = os.getenv("SMTP_EMAIL", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    receiver_email = os.getenv("CONTACT_RECEIVER_EMAIL", smtp_email)

    if not smtp_server or not smtp_email or not smtp_password:
        return {"error": "Email service not configured. Set SMTP_SERVER, SMTP_EMAIL, SMTP_PASSWORD in .env"}

    msg = EmailMessage()
    msg["Subject"] = f"[VoltVision Contact] {subject}"
    msg["From"] = smtp_email
    msg["To"] = receiver_email
    msg["Reply-To"] = sender_email

    body = (
        f"Name: {name}\n"
        f"Email: {sender_email}\n"
        f"Subject: {subject}\n"
        f"\nMessage:\n{message}\n"
        f"\n---\nSent via VoltVision Contact Form"
    )
    msg.set_content(body)

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as smtp:
            smtp.starttls()
            smtp.login(smtp_email, smtp_password)
            smtp.send_message(msg)
        return {"success": True}
    except smtplib.SMTPAuthenticationError:
        return {"error": "SMTP authentication failed. Check SMTP_EMAIL and SMTP_PASSWORD."}
    except smtplib.SMTPConnectError:
        return {"error": f"Could not connect to SMTP server '{smtp_server}:{smtp_port}'."}
    except Exception as e:
        return {"error": str(e)}
