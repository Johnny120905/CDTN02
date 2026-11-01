import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    PORT = int(os.getenv("PORT", 8002))
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "CDTN02_SUPER_SECURE_JWT_SECRET_KEY_2026")
    MONGO_URI = os.getenv(
        "MONGO_URI",
        "mongodb://huynhnguyenbaongoc2k5_db_user:RaBr6xjc5ogYXQwL@ac-ojfhioo-shard-00-00.cpczyp1.mongodb.net:27017,ac-ojfhioo-shard-00-01.cpczyp1.mongodb.net:27017,ac-ojfhioo-shard-00-02.cpczyp1.mongodb.net:27017/?ssl=true&replicaSet=atlas-xcshgl-shard-0&authSource=admin&appName=CDTN02-DB"
    )
    DATABASE_NAME = os.getenv("DATABASE_NAME", "CDTN02_DB")

    # Brevo Mail / SMTP Relay Integration (xsmtpsib)
    BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp-relay.brevo.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "huynhnguyenbaongoc2k5@gmail.com")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", os.getenv("BREVO_API_KEY", ""))
    MAIL_DEFAULT_SENDER = ("PARTIME.VN", os.getenv("MAIL_USERNAME", "huynhnguyenbaongoc2k5@gmail.com"))


