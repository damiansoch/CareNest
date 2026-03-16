"""
Document encryption at rest.

Key derivation: SHA-256 of Django's SECRET_KEY → 32-byte AES key → Fernet.
Fernet provides AES-128-CBC + HMAC-SHA256 (authenticated encryption).

⚠  ROTATION WARNING: If you change SECRET_KEY, all encrypted documents become
   unreadable.  To switch to a dedicated key later, add DOCUMENT_ENCRYPTION_KEY
   to your .env and change _get_fernet() to read it instead of SECRET_KEY.
"""

import base64
import hashlib

from cryptography.fernet import Fernet
from django.conf import settings


def _get_fernet() -> Fernet:
    # Derive a stable 32-byte key from SECRET_KEY via SHA-256.
    # To use a dedicated key instead, replace this with:
    #   raw_key = settings.DOCUMENT_ENCRYPTION_KEY.encode()
    #   return Fernet(base64.urlsafe_b64encode(hashlib.sha256(raw_key).digest()))
    key_bytes = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key_bytes))


def encrypt_bytes(raw: bytes) -> bytes:
    """Encrypt raw binary content. Returns Fernet token (bytes)."""
    return _get_fernet().encrypt(raw)


def decrypt_bytes(ciphertext: bytes) -> bytes:
    """Decrypt a Fernet token. Raises cryptography.fernet.InvalidToken on failure."""
    return _get_fernet().decrypt(ciphertext)
