
from cryptography.fernet import Fernet
#from .vault_utils import get_encryption_key

#fernet = Fernet(get_encryption_key())
fernet = Fernet("1234")

def encrypt_text(text):
    if text is None:
        return None
    return fernet.encrypt(str(text).encode()).decode()

def decrypt_text(token):
    if token is None:
        return None
    return fernet.decrypt(token.encode()).decode()
