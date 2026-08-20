# hrms_backend/utils/vault_utils.py
import os
import hvac

def get_encryption_key():
    client = hvac.Client(
        url=os.getenv("VAULT_ADDR", "http://127.0.0.1:8200"),
        token=os.getenv("VAULT_TOKEN")
    )

    if not client.is_authenticated():
        raise Exception("Vault is not authenticated.")

    secret = client.secrets.kv.v2.read_secret_version(path="django")
    return secret["data"]["data"]["ENCRYPTION_KEY"]
