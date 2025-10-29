from typing import Annotated

from fastapi import FastAPI, Query, Depends, HTTPException, Request, status
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from datetime import datetime
from sqlmodel import Session, select
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
import os


from dotenv import load_dotenv

load_dotenv()
from . import utils

from . import models
from . import sockets

SECRET_KEY = os.environ["SECRET_KEY"]
ALGORITHM = os.environ["ALGORITHM"]
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"])


app = FastAPI()

app.include_router(sockets.router)

@app.on_event("startup")
def on_startup():
    models.create_db_and_tables()

""" TODO:
https://github.com/tmkontra/fastapi-static-digest maybe
def cache_bust(filename):
    stat = os.stat('static/' + filename)
    return f"{filename}?mtime={stat.st_mtime}"

app.temlating.jinja_env.globals.update(cache_bust=cache_bust) """

app.mount("/static", StaticFiles(directory="static"), name="static")


templates = Jinja2Templates(directory="templates")



def get_session():
    with Session(models.engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]


@app.post("/token")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> utils.Token:
    user = utils.authenticate_user(utils.fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = utils.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return utils.Token(access_token=access_token, token_type="bearer")

@app.get("/users/me")
async def read_users_me(
    current_user: Annotated[utils.User, Depends(utils.get_current_user)],
):
    return current_user

@app.post("/songs/", response_model=models.SongPublic)
def create_song(song: models.SongCreate, session: SessionDep) -> models.Song:
    current_user: Annotated[utils.User, Depends(utils.get_current_user)]
    db_song = models.Song.model_validate(song)
    session.add(db_song)
    session.commit()
    session.refresh(db_song)
    return db_song

@app.get("/songs/", response_model=list[models.SongPublic])
def read_songs(
    current_user: Annotated[utils.User, Depends(utils.get_current_user)],
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
):
    songs = session.exec(select(models.Song).offset(offset).limit(limit)).all()
    return songs

@app.get("/songs/{song_id}", response_model=models.SongPublic)
def read_song(song_id: int, session: SessionDep) -> models.Song:
    song = session.get(models.Song, song_id)
    if not song:
        raise HTTPException(status_code=404, detail="models.Song not found")
    return song

@app.delete("/songs/{song_id}")
def delete_song(song_id: int, session: SessionDep):
    song = session.get(models.Song, song_id)
    if not song:
        raise HTTPException(status_code=404, detail="models.Song not found")
    session.delete(song)
    session.commit()
    return {"ok": True}

@app.patch("/songs/{song_id}", response_model=models.SongPublic)
def update_song(song_id: int, session: SessionDep, song: models.SongUpdate) -> models.Song:
    song_db = session.get(models.Song, song_id)
    song_data = song.model_dump(exclude_unset=True)
    song_db.sqlmodel_update(song_data)
    session.add(song_db)
    session.commit()
    session.refresh(song_db)
    return song_db



@app.post("/events/", response_model=models.EventPublic)
def create_event(event: models.EventCreate, session: SessionDep) -> models.Event:
    db_event = models.Event.model_validate(event)
    session.add(db_event)
    session.commit()
    session.refresh(db_event)
    return db_event

@app.get("/events/", response_model=list[models.EventPublic])
def read_events(
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
):
    events = session.exec(select(models.Event).offset(offset).limit(limit)).all()
    return events

@app.get("/events/{event_id}", response_model=models.EventPublic)
def read_event(event_id: int, session: SessionDep) -> models.Event:
    event = session.get(models.Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="models.Event not found")
    return event

@app.delete("/events/{event_id}")
def delete_event(event_id: int, session: SessionDep):
    event = session.get(models.Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="models.Event not found")
    session.delete(event)
    session.commit()
    return {"ok": True}

@app.patch("/events/{event_id}", response_model=models.EventPublic)
def update_event(event_id: int, session: SessionDep, event: models.EventUpdate) -> models.Event:
    event_db = session.get(models.Event, event_id)
    event_data = event.model_dump(exclude_unset=True)
    event_db.sqlmodel_update(event_data)
    session.add(event_db)
    session.commit()
    session.refresh(event_db)
    return event_db


@app.post("/songuses/", response_model=models.SongUsePublic)
def create_song(songuse: models.SongUseCreate, session: SessionDep) -> models.SongUse:
    db_songuse = models.SongUse.model_validate(songuse)
    session.add(db_songuse)
    session.commit()
    session.refresh(db_songuse)
    return db_songuse

@app.get("/songuses/", response_model=list[models.SongUsePublic])
def read_songuses(
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
):
    songuses = session.exec(select(models.SongUse).offset(offset).limit(limit)).all()
    return songuses

@app.get("/songuses/{songuse_id}", response_model=models.SongUsePublic)
def read_songuse(songuse_id: int, session: SessionDep) -> models.SongUse:
    songuse = session.get(models.SongUse, songuse_id)
    if not songuse:
        raise HTTPException(status_code=404, detail="models.SongUse not found")
    return songuse

@app.delete("/songuses/{songuse_id}")
def delete_songuse(songuse_id: int, session: SessionDep):
    songuse = session.get(models.SongUse, songuse_id)
    if not songuse:
        raise HTTPException(status_code=404, detail="models.SongUse not found")
    session.delete(songuse)
    session.commit()
    return {"ok": True}

@app.patch("/songuses/{songuse_id}", response_model=models.SongUsePublic)
def update_songuse(songuse_id: int, session: SessionDep, songuse: models.SongUseUpdate) -> models.SongUse:
    songuse_db = session.get(models.SongUse, songuse_id)
    songuse_data = songuse.model_dump(exclude_unset=True)
    songuse_db.sqlmodel_update(songuse_data)
    session.add(songuse_db)
    session.commit()
    session.refresh(songuse_db)
    return songuse_db


@app.get("/", response_class=HTMLResponse)
@app.get("/index", response_class=HTMLResponse)
async def read_item(request: Request):
    return templates.TemplateResponse(
        request=request, name="index.html",
        context={
            "user": {},
            "module": "index",
            "ws_type": "index",
            "ws_group": 0,
        },
    )

@app.get("/event", response_class=HTMLResponse)
@app.get("/event/{id}", response_class=HTMLResponse)
async def read_item(request: Request, id: int = 0):
    return templates.TemplateResponse(
        request=request, name="index.html",
        context={
            "user": {},
            "module": "events",
            "ws_type": "events",
            "ws_group": id,
        },
    )
