from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-!c(w8-qe)zzz11+$%$yq#h&-igmxehc^!suxgl7^b-d+bw6s$7'

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'ckpsca.in', 'api.ckpsca.in', 'django_backend']

DATA_UPLOAD_MAX_NUMBER_FILES = 50
DATA_UPLOAD_MAX_MEMORY_SIZE  = 104857600
FILE_UPLOAD_MAX_MEMORY_SIZE  = 104857600

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'django_filters',
    'corsheaders',
    # ── Your Apps ──
    'account',
    'employee',
    'clients',
    'payroll',
    # 'indirect_tax',     # ← Your new app
]

AUTH_USER_MODEL = 'account.User'

MIDDLEWARE = [
    'hrms_backend.cors_middleware.ManualCorsMiddleware',  # ← ADD THIS FIRST
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'onboarding': '20/hour',
    },
}

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
STATIC_URL  = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

MEDIA_URL  = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

ROOT_URLCONF = 'hrms_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'hrms_backend.wsgi.application'

AUTHENTICATION_BACKENDS = [
    'account.backends.EmailBackend',
    'django.contrib.auth.backends.ModelBackend',
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'hrms_db',
        'USER': 'root',
        'PASSWORD': 'ashwith',
        'HOST': '127.0.0.1',
        'PORT': '3306',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE     = 'Asia/Kolkata'
USE_I18N      = True
USE_TZ        = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ─── CORS ─────────────────────────────────────────────────────────────────────
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False

CORS_ALLOW_METHODS = [
    'DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept', 'accept-encoding', 'authorization',
    'content-type', 'dnt', 'origin', 'user-agent',
    'x-csrftoken', 'x-requested-with',
]

CSRF_COOKIE_NAME     = 'csrftoken'
CSRF_COOKIE_HTTPONLY = False
X_FRAME_OPTIONS      = 'SAMEORIGIN'
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_COOKIE_AGE   = 3600

if DEBUG:
    FRONTEND_URL = "http://localhost:3000"

    CORS_ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    CSRF_TRUSTED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    CSRF_COOKIE_SAMESITE    = 'Lax'
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE   = False
    CSRF_COOKIE_SECURE      = False
    SESSION_COOKIE_DOMAIN   = None
    CSRF_COOKIE_DOMAIN      = None

else:
    FRONTEND_URL = "https://ckpsca.in"

    CORS_ALLOWED_ORIGINS = [
        "https://ckpsca.in",
        "https://www.ckpsca.in",
        "https://api.ckpsca.in",
    ]
    CSRF_TRUSTED_ORIGINS = [
        "https://ckpsca.in",
        "https://www.ckpsca.in",
        "https://api.ckpsca.in",
    ]
    CSRF_COOKIE_SAMESITE    = 'None'
    SESSION_COOKIE_SAMESITE = 'None'
    SESSION_COOKIE_SECURE   = True
    CSRF_COOKIE_SECURE      = True
    SESSION_COOKIE_DOMAIN   = ".ckpsca.in"
    CSRF_COOKIE_DOMAIN      = ".ckpsca.in"
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    USE_X_FORWARDED_HOST    = True

# ─── Email ────────────────────────────────────────────────────────────────────
EMAIL_BACKEND       = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST          = 'smtp.gmail.com'
EMAIL_PORT          = 587
EMAIL_USE_TLS       = True
EMAIL_HOST_USER     = 'audits@ckpsca.com'
EMAIL_HOST_PASSWORD = ''
DEFAULT_FROM_EMAIL  = '"CAPSCA" <audits@ckpsca.com>'

# ─── PDF Kit (Optional) ───────────────────────────────────────────────────────
try:
    import pdfkit
    PDFKIT_CONFIG    = pdfkit.configuration(
        wkhtmltopdf=r'C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe'
    )
    PDFKIT_AVAILABLE = True
except (OSError, ImportError):
    PDFKIT_CONFIG    = None
    PDFKIT_AVAILABLE = False
    print("⚠️  WARNING: pdfkit/wkhtmltopdf not available - PDF features disabled")

# ─── Encryption ───────────────────────────────────────────────────────────────
LOCAL_ENCRYPT_KEY = os.environ.get(
    'HRMS_LOCAL_ENCRYPT_KEY',
    'kuqk1C8S2lPPOYAK3d8TqIqXiZcnk3_IUTnc3SGCiVE='
)



# celery -->new 
# CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
# CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/1')

CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/1'
CELERY_REDIS_BACKEND_USE_SSL = False
