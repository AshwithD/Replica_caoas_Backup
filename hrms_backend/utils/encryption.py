# hrms_backend/utils/encryption.py

# from cryptography.fernet import Fernet
# import os

# ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "Z1ckfDDQjgvHpYp0m0TlVwvL0Iq3oB_ObLh0FRBlPtc=")

# fernet = Fernet(ENCRYPTION_KEY)

# def encrypt_text(text):
#     if text is None:
#         return None
#     return fernet.encrypt(str(text).encode()).decode()

# def decrypt_text(token):
#     if token is None:
#         return None
#     return fernet.decrypt(token.encode()).decode()


# hrms_backend/utils/encryption.py
# from cryptography.fernet import Fernet
# from .vault_utils import get_encryption_key

# fernet = Fernet(get_encryption_key())

# def encrypt_text(text):
#     if text is None:
#         return None
#     return fernet.encrypt(str(text).encode()).decode()

# def decrypt_text(token):
#     if token is None:
#         return None
#     return fernet.decrypt(token.encode()).decode()


from cryptography.fernet import Fernet
#from .vault_utils import get_encryption_key

#fernet = Fernet(get_encryption_key())
fernet = Fernet("AQw4RPRiUesC2cnsKPJeWFFGSa2Etm6WrThXh4_uKJU=")

def encrypt_text(text):
    if text is None:
        return None
    return fernet.encrypt(str(text).encode()).decode()

def decrypt_text(token):
    if token is None:
        return None
    return fernet.decrypt(token.encode()).decode()