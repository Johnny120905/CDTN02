import json
import os
import smtplib
import urllib.error
import urllib.request
from email.header import Header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from typing import Tuple
from dotenv import load_dotenv


def reload_env():
    candidate_paths = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", ".env")),
        os.path.join(os.getcwd(), ".env"),
        os.path.join(os.getcwd(), "Backend", ".env"),
        os.path.join(os.getcwd(), "backend", ".env"),
    ]
    for p in candidate_paths:
        if os.path.exists(p):
            load_dotenv(p, override=True)
            return True
    load_dotenv(override=True)
    return False


reload_env()


def _build_email_bodies(recipient_email: str, otp_code: str, purpose: str) -> Tuple[str, str, str, str]:
    if purpose == "register":
        purpose_text = "Đăng ký tài khoản"
    elif purpose == "forgot_password":
        purpose_text = "Đặt lại mật khẩu"
    else:
        purpose_text = "Xác thực tài khoản"

    subject = f"[{otp_code}] Ma xac thuc OTP {purpose_text} - PARTIME.VN"

    html_content = f"""
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }}
            .container {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
            .header {{ background: linear-gradient(135deg, #030712 0%, #1e3a8a 100%); padding: 24px; text-align: center; color: #ffffff; }}
            .brand {{ font-size: 22px; font-weight: bold; letter-spacing: 1px; color: #38bdf8; }}
            .sub-brand {{ font-size: 13px; color: #94a3b8; margin-top: 4px; }}
            .content {{ padding: 28px 24px; }}
            .greeting {{ font-size: 15px; margin-bottom: 16px; color: #334155; }}
            .otp-box {{ text-align: center; margin: 24px 0; background: #f0f9ff; border: 2px dashed #0284c7; border-radius: 10px; padding: 18px; }}
            .otp-code {{ font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0284c7; font-family: 'Consolas', 'Courier New', monospace; }}
            .warning {{ font-size: 13px; color: #64748b; line-height: 1.6; margin-top: 20px; }}
            .footer {{ background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="brand">PARTIME.VN</div>
                <div class="sub-brand">NEN TANG TUYEN DUNG VIEC LAM LINH HOAT CHO SINH VIEN</div>
            </div>
            <div class="content">
                <p class="greeting">Xin chao <b>{recipient_email}</b>,</p>
                <p>Ban vua yeu cau <b>{purpose_text.lower()}</b> tren he thong PARTIME.VN. Duoi day la ma xac thuc OTP cua ban:</p>
                
                <div class="otp-box">
                    <div class="otp-code">{otp_code}</div>
                </div>

                <p class="warning">
                    <b>Luu y bao mat:</b><br>
                    • Ma xac thuc nay co hieu luc trong 60 giay.<br>
                    • Tuyet doi khong chia se ma nay cho bat ky ai de bao ve tai khoan cua ban.<br>
                    • Neu ban khong yeu cau ma nay, vui long bo qua email nay.
                </p>
            </div>
            <div class="footer">
                © 2026 PARTIME.VN - Nen tang ket noi viec lam linh hoat danh cho sinh vien.<br>
                Thu duoc gui tu dong, vui long khong phan hoi email nay.
            </div>
        </div>
    </body>
    </html>
    """

    plain_content = f"Ma xac thuc OTP {purpose_text} cua ban la: {otp_code}. Ma co hieu luc trong 60 giay. Tuyet doi khong chia se ma nay cho bat ky ai."
    return purpose_text, subject, plain_content, html_content


def _send_via_brevo_api(
    api_key: str,
    sender_email: str,
    sender_name: str,
    recipient_email: str,
    subject: str,
    plain_content: str,
    html_content: str,
) -> Tuple[bool, str]:
    payload = {
        "sender": {"name": sender_name or "PARTIME.VN", "email": sender_email},
        "to": [{"email": recipient_email}],
        "subject": subject,
        "textContent": plain_content,
        "htmlContent": html_content,
    }
    req = urllib.request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={
            "api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "PARTIME-VN-Backend/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            status = getattr(resp, "status", 200)
            body = resp.read().decode("utf-8", errors="replace")
            if 200 <= status < 300:
                print(f"[Brevo API] Successfully sent OTP to {recipient_email} (HTTP {status}): {body[:160]}")
                return True, ""
            err = f"Brevo API unexpected HTTP {status}: {body[:200]}"
            print(f"[Brevo API Warning] {err}")
            return False, err
    except urllib.error.HTTPError as http_err:
        err_body = ""
        try:
            err_body = http_err.read().decode("utf-8", errors="replace")
        except Exception:
            pass
        err = f"Brevo API HTTP {http_err.code}: {err_body or http_err.reason}"
        print(f"[Brevo API Error] {err.encode('ascii', 'replace').decode('ascii')}")
        return False, err
    except Exception as ex:
        err = f"Brevo API request failed: {ex}"
        print(f"[Brevo API Warning] {err.encode('ascii', 'replace').decode('ascii')}")
        return False, err


def _send_via_brevo_smtp(
    smtp_server: str,
    smtp_port: int,
    smtp_login: str,
    smtp_password: str,
    sender_email: str,
    sender_name: str,
    recipient_email: str,
    subject: str,
    plain_content: str,
    html_content: str,
) -> Tuple[bool, str]:
    msg = MIMEMultipart("alternative")
    # Chuan RFC 5322/2047: Chi ma hoa display name UTF-8, giu nguyen <sender_email>
    msg["From"] = formataddr((str(Header(sender_name or "PARTIME.VN", "utf-8")), sender_email))
    msg["To"] = recipient_email
    msg["Subject"] = Header(subject, "utf-8")

    msg.attach(MIMEText(plain_content, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    try:
        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_server, smtp_port, timeout=12) as server:
                server.login(smtp_login, smtp_password)
                server.sendmail(sender_email, [recipient_email], msg.as_string())
        else:
            with smtplib.SMTP(smtp_server, smtp_port, timeout=12) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(smtp_login, smtp_password)
                server.sendmail(sender_email, [recipient_email], msg.as_string())
        print(f"[Brevo SMTP] Successfully sent OTP to {recipient_email}")
        return True, ""
    except Exception as ex:
        err = f"Brevo SMTP ({smtp_server}:{smtp_port}) failed: {ex}"
        print(f"[Brevo SMTP Warning] {err.encode('ascii', 'replace').decode('ascii')}")
        return False, err


def send_otp_email_with_status(
    recipient_email: str,
    otp_code: str,
    purpose: str = "forgot_password",
) -> Tuple[bool, str]:
    """
    Gui email OTP uu tien qua Brevo HTTPS API v3 (cong 443, khong bi chan tren Render),
    fallback ve Brevo SMTP (RFC 5322 formataddr) neu API key chua co hoac loi.
    Tra ve (thanh_cong, chi_tiet_loi).
    """
    reload_env()
    api_key = os.getenv("BREVO_API_KEY", "").strip()
    smtp_server = (os.getenv("BREVO_SMTP_SERVER") or os.getenv("MAIL_SERVER") or "smtp-relay.brevo.com").strip()
    try:
        smtp_port = int(os.getenv("BREVO_SMTP_PORT") or os.getenv("MAIL_PORT") or "587")
    except ValueError:
        smtp_port = 587
    smtp_login = (os.getenv("BREVO_SMTP_LOGIN") or os.getenv("MAIL_USERNAME") or "").strip()
    smtp_password = (os.getenv("BREVO_SMTP_KEY") or os.getenv("MAIL_PASSWORD") or "").strip()
    sender_email = (os.getenv("BREVO_SENDER_EMAIL") or os.getenv("MAIL_USERNAME") or "vuthelong1009@gmail.com").strip()
    sender_name = (os.getenv("BREVO_SENDER_NAME") or "PARTIME.VN - Viec Lam Linh Hoat").strip()

    if not api_key and smtp_password.startswith("xkeysib-"):
        api_key = smtp_password

    if not api_key and (not smtp_login or not smtp_password):
        err = "Thieu BREVO_API_KEY va BREVO_SMTP_LOGIN/BREVO_SMTP_KEY trong Environment."
        print(f"[Brevo Email Warning] {err}")
        return False, err

    _, subject, plain_content, html_content = _build_email_bodies(recipient_email, otp_code, purpose)
    errors = []

    if api_key:
        ok, api_err = _send_via_brevo_api(
            api_key, sender_email, sender_name, recipient_email, subject, plain_content, html_content
        )
        if ok:
            return True, ""
        errors.append(api_err)

    if smtp_login and smtp_password:
        ok, smtp_err = _send_via_brevo_smtp(
            smtp_server, smtp_port, smtp_login, smtp_password, sender_email, sender_name,
            recipient_email, subject, plain_content, html_content
        )
        if ok:
            return True, ""
        errors.append(smtp_err)

    return False, " | ".join(errors) if errors else "Khong the gui email OTP."


def send_otp_email(recipient_email: str, otp_code: str, purpose: str = "forgot_password") -> bool:
    ok, _ = send_otp_email_with_status(recipient_email, otp_code, purpose)
    return ok
