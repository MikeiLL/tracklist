import bcrypt
import binascii
import os
from datetime import datetime, timezone, timedelta
import jwt

SECRET_KEY = os.environ["SECRET_KEY"]
ALGORITHM = os.environ["ALGORITHM"]
ACCESS_TOKEN_EXPIRE_MINUTES = os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"]

def hash_password(password):
	return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(15)).decode('utf-8')

def check_password(password, hashed):
	return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def random_hex():
	return binascii.b2a_hex(os.urandom(8)).decode("ascii")

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
