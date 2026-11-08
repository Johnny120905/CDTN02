import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
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

def send_otp_email(recipient_email: str, otp_code: str, purpose: str = "forgot_password") -> bool:
    """
    Gui email chua ma OTP qua Brevo SMTP Relay.
    An toan: Khong chua ky tu co dau trong print() de tranh loi UnicodeEncodeError tren Windows cmd.
    """
    reload_env()
    smtp_server = os.getenv("BREVO_SMTP_SERVER", "smtp-relay.brevo.com")
    smtp_port = int(os.getenv("BREVO_SMTP_PORT", "587"))
    smtp_login = os.getenv("BREVO_SMTP_LOGIN", "").strip()
    smtp_password = os.getenv("BREVO_SMTP_KEY", "").strip()
    sender_email = os.getenv("BREVO_SENDER_EMAIL", "vuthelong1009@gmail.com").strip()
    sender_name = os.getenv("BREVO_SENDER_NAME", "PARTIME.VN - Viec Lam Linh Hoat").strip()

    if not smtp_login or not smtp_password:
        print("[Brevo Email Warning] Missing BREVO_SMTP_LOGIN or BREVO_SMTP_KEY in environment.")
        return False

    if purpose == "register":
        purpose_text = "Đăng ký tài khoản"
    elif purpose == "forgot_password":
        purpose_text = "Đặt lại mật khẩu"
    else:
        purpose_text = "Xác thực tài khoản"

    msg = MIMEMultipart("alternative")
    msg["From"] = f"{sender_name} <{sender_email}>"
    msg["To"] = recipient_email
    msg["Subject"] = f"[{otp_code}] Ma xac thuc OTP {purpose_text} - PARTIME.VN"

    # HTML Email Template
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
                    • Ma xac thuc nay co hieu luc trong thoi gian ngan.<br>
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

    plain_content = f"Ma xac thuc OTP {purpose_text} cua ban la: {otp_code}. Tuyet doi khong chia se ma nay cho bat ky ai."

    msg.attach(MIMEText(plain_content, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    try:
        with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_login, smtp_password)
            server.sendmail(sender_email, recipient_email, msg.as_string())
        print(f"[Brevo Email] Successfully sent OTP to: {recipient_email}")
        return True
    except Exception as e:
        print(f"[Brevo Email Warning] Could not send email: {e}")
        return False