from typing import Annotated
import bcrypt
import binascii
import os
from datetime import datetime, timezone, timedelta
import jwt
from jwt.exceptions import InvalidTokenError

from fastapi import Depends, HTTPException, status, Request
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

SECRET_KEY = os.environ["SECRET_KEY"]
ALGORITHM = os.environ["ALGORITHM"]
ACCESS_TOKEN_EXPIRE_MINUTES = os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"]

def hash_password(password):
	return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(15)).decode('utf-8')

def check_password(password, hashed):
	return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def random_hex():
	return binascii.b2a_hex(os.urandom(8)).decode("ascii")

fake_users_db = {
    os.environ["SINGLE_USER"]: {
        "hashed_password": os.environ["HASHED_PASSWORD"],
        "username": os.environ["SINGLE_USER"],
    },
}


class InvalidCredentialsError(HTTPException):
    def __init__(self):
        super().__init__(
            status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
          )

class OAuth2PasswordBearerWithCookie(OAuth2PasswordBearer):
    async def __call__(self, request: Request) -> str | None:
        authorization: str = request.cookies.get("tracklist_access_token")
        scheme, param = authorization.split(" ")
        if not authorization or scheme.lower() != "bearer":
            if self.auto_error:
                raise InvalidCredentialsError
            else:
                return None
        return param

oauth2_scheme = OAuth2PasswordBearerWithCookie(tokenUrl="token")

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

class User(BaseModel):
    username: str


class UserInDB(User):
    hashed_password: str

def get_user(db, username: str):
    if username in db:
        user_dict = db[username]
        return UserInDB(**user_dict)

def authenticate_user(fake_db, username: str, password: str):
    user = get_user(fake_db, username)
    if not user:
        return False
    if not check_password(password, user.hashed_password):
        return False
    return user

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise InvalidCredentialsError
        token_data = TokenData(username=username)
    except InvalidTokenError:
        raise InvalidCredentialsError
    user = get_user(fake_users_db, username=token_data.username)
    if user is None:
        raise InvalidCredentialsError
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
