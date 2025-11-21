from typing import Annotated

from fastapi import FastAPI, Query, Depends, HTTPException, Request, status, Response
from fastapi.responses import HTMLResponse
from starlette.staticfiles import StaticFiles, NotModifiedResponse
from starlette import datastructures
from starlette.responses import FileResponse
import anyio
from fastapi.templating import Jinja2Templates
from datetime import datetime
from sqlmodel import Session, select
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
import os
import stat
import random



from dotenv import load_dotenv

load_dotenv()
from . import utils

from . import models
from . import sockets
from . import database

SECRET_KEY = os.environ["SECRET_KEY"]
ALGORITHM = os.environ["ALGORITHM"]
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"])


app = FastAPI()

app.include_router(sockets.router)

class FileResponse(FileResponse):
    async def __call__(self, scope, receive, send):
        if not self.path.endswith(".js"): return await super().__call__(scope, receive, send)
        if self.stat_result is None:
            try:
                stat_result = await anyio.to_thread.run_sync(os.stat, self.path)
                self.set_stat_headers(stat_result)
            except FileNotFoundError:
                raise RuntimeError(f"File at path {self.path} does not exist.")
            else:
                mode = stat_result.st_mode
                if not stat.S_ISREG(mode):
                    raise RuntimeError(f"File at path {self.path} is not a file.")
        else:
            stat_result = self.stat_result
        await send({"type": "http.response.start", "status": self.status_code, "headers": self.raw_headers})
        if scope["method"].upper() == "HEAD":
            await send({"type": "http.response.body", "body": b"", "more_body": False})
        else:
            async with await anyio.open_file(self.path, mode="rb") as file:
                data = await file.read()
            data = data.replace(b"$$cachebust$$", b"?cache=" + cache_buster.encode())
            await send({"type": "http.response.body", "body": data, "more_body": False})


class StaticFiles(StaticFiles):
    # TODO: If/when the cache bust tag changes, redefine is_not_modified accordingly
    def file_response(self, path, stat, scope, status=200):
        headers = datastructures.Headers(scope=scope)
        resp = FileResponse(path, status_code=status, stat_result=stat)
        if self.is_not_modified(resp.headers, headers): # and cache_buster hasn't changed (check ETag?)
            return NotModifiedResponse(resp.headers)
        return resp

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    authorization: str = request.cookies.get("tracklist_access_token", "")
    token: str = authorization.replace("Bearer ", "")
    user = None
    try:
        user = await utils.get_current_user(token)
    except utils.InvalidCredentialsError:
        pass

    if not user and request.url.path not in ["/docs","/token", "/openapi.json"] and not request.url.path.startswith("/static"):
        return templates.TemplateResponse(
        request=request, name="login.html",
        context={"user": {}},
        status_code=401
    )
    request.state.user = user or {}
    response = await call_next(request)
    return response

@app.on_event("startup")
def on_startup():
    models.create_db_and_tables()

app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")

# TODO: Get an inotify watch on the static/ directory, and on any CLOSE_WRITE,
#regenerate cache_buster
cache_buster = hex(random.randrange(0x100000, 0x1000000))[2:]
templates.env.filters["static"] = lambda fn: "/static/" + fn + "?cache=" + cache_buster

def get_session():
    with Session(models.engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]


@app.post("/token")
async def login_for_access_token(
    response: Response,
    request: Request,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Response:
    user = await database.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = utils.create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )

    response.set_cookie(key="tracklist_access_token",value=f"Bearer {access_token}", httponly=True)
    return

@app.get("/users/me")
async def read_users_me(
    current_user: Annotated[utils.User, Depends(utils.get_current_user)],
):
    return current_user

@app.get("/eventsongs/", response_model=list[models.EventSongsPublic])
def read_event_songs(
        current_user: Annotated[utils.User, Depends(utils.get_current_user)],
        session: SessionDep,
        offset: int = 0,
        limit: Annotated[int, Query(le=100)] = 100,
    ):
    events = session.exec(select(models.Event).offset(offset).limit(limit).order_by(models.Event.title.asc())).all()
    return events

@app.post("/songs/", response_model=models.SongPublic)
def create_song(
        song: models.SongCreate,
        session: SessionDep,
        current_user: Annotated[utils.User, Depends(utils.get_current_user)],
        ) -> models.Song:
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
    songs = session.exec(select(models.Song).offset(offset).limit(limit).order_by(models.Song.title.asc())).all()
    return songs

@app.get("/songsearch", response_model=list[models.SongPublic])
def read_song(
        current_user: Annotated[utils.User, Depends(utils.get_current_user)],
        session: SessionDep,
        offset: int = 0,
        limit: Annotated[int, Query(le=100)] = 100,
        title: str | None = None) -> models.Song:
    songs = None
    if title:
        songs = session.exec(select(models.Song).filter(models.Song.title.like(f'%{title}%'))).all()
    else:
        songs = session.exec(select(models.Song).offset(offset).limit(limit)).all()
    if not songs:
        raise HTTPException(status_code=404, detail="models.Song not found")
    return songs

@app.delete("/songs/{song_id}")
def delete_song(
        song_id: int,
        session: SessionDep,
        current_user: Annotated[utils.User, Depends(utils.get_current_user)],
        ):
    song = session.get(models.Song, song_id)
    if not song:
        raise HTTPException(status_code=404, detail="models.Song not found")
    session.delete(song)
    session.commit()
    return {"ok": True}

@app.patch("/songs/{song_id}", response_model=models.SongPublic)
def update_song(
        song_id: int,
        session: SessionDep,
        current_user: Annotated[utils.User, Depends(utils.get_current_user)],
        song: models.SongUpdate) -> models.Song:
    song_db = session.get(models.Song, song_id)
    song_data = song.model_dump(exclude_unset=True)
    song_db.sqlmodel_update(song_data)
    session.add(song_db)
    session.commit()
    session.refresh(song_db)
    return song_db



@app.post("/events/", response_model=models.EventPublic)
def create_event(
        event: models.EventCreate,
        session: SessionDep,
        current_user: Annotated[utils.User, Depends(utils.get_current_user)],
    ) -> models.Event:
    db_event = models.Event.model_validate(event)
    session.add(db_event)
    session.commit()
    session.refresh(db_event)
    return db_event

@app.get("/events/", response_model=list[models.EventPublic])
def read_events(
        current_user: Annotated[utils.User, Depends(utils.get_current_user)],
        session: SessionDep,
        offset: int = 0,
        limit: Annotated[int, Query(le=100)] = 100,
    ):
    events = session.exec(select(models.Event).offset(offset).limit(limit).order_by(models.Event.date.asc())).all()
    return events

@app.get("/events/{event_id}", response_model=models.EventPublic)
def read_event(
        event_id: int,
        session: SessionDep,
        current_user: Annotated[utils.User, Depends(utils.get_current_user)],
    ) -> models.Event:
    event = session.get(models.Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="models.Event not found")
    return event

@app.delete("/events/{event_id}")
def delete_event(
        event_id: int,
        session: SessionDep,
        current_user: Annotated[utils.User, Depends(utils.get_current_user)]
    ):
    event = session.get(models.Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="models.Event not found")
    session.delete(event)
    session.commit()
    return {"ok": True}

@app.patch("/events/{event_id}", response_model=models.EventPublic)
def update_event(
        event_id: int,
        session: SessionDep,
        event: models.EventUpdate,
        current_user: Annotated[utils.User, Depends(utils.get_current_user)],
    ) -> models.Event:
    event_db = session.get(models.Event, event_id)
    event_data = event.model_dump(exclude_unset=True)
    event_db.sqlmodel_update(event_data)
    session.add(event_db)
    session.commit()
    session.refresh(event_db)
    return event_db


@app.post("/songuses/", response_model=models.SongUsePublic)
def create_song(
        songuse: models.SongUseCreate,
        session: SessionDep,
        current_user: Annotated[utils.User, Depends(utils.get_current_user)],
    ) -> models.SongUse:
    db_songuse = models.SongUse.model_validate(songuse)
    session.add(db_songuse)
    session.commit()
    session.refresh(db_songuse)
    return db_songuse

@app.get("/songuses/", response_model=list[models.SongUsePublic])
def read_songuses(
        current_user: Annotated[utils.User, Depends(utils.get_current_user)],
        session: SessionDep,
        offset: int = 0,
        limit: Annotated[int, Query(le=100)] = 100,
    ):
    songuses = session.exec(select(models.SongUse).offset(offset).limit(limit)).all()
    return songuses

@app.get("/songuses/{songuse_id}", response_model=models.SongUsePublic)
def read_songuse(
        current_user: Annotated[utils.User, Depends(utils.get_current_user)],
        songuse_id: int,
        session: SessionDep) -> models.SongUse:
    songuse = session.get(models.SongUse, songuse_id)
    if not songuse:
        raise HTTPException(status_code=404, detail="models.SongUse not found")
    return songuse

@app.delete("/songuses/{songuse_id}")
def delete_songuse(
        current_user: Annotated[utils.User, Depends(utils.get_current_user)],
        songuse_id: int, session: SessionDep):
    songuse = session.get(models.SongUse, songuse_id)
    if not songuse:
        raise HTTPException(status_code=404, detail="models.SongUse not found")
    session.delete(songuse)
    session.commit()
    return {"ok": True}

@app.patch("/songuses/{songuse_id}", response_model=models.SongUsePublic)
def update_songuse(
        current_user: Annotated[utils.User, Depends(utils.get_current_user)],
        songuse_id: int,
        session: SessionDep,
        songuse: models.SongUseUpdate) -> models.SongUse:
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
    user = {} #utils.get_current_user() | {}
    response = templates.TemplateResponse(
        request=request, name="index.html",
        context={
            "user": request.state.user,
            "module": "index",
            "ws_type": "index",
            "ws_group": 0,
        },
    )
    return response


@app.get("/login", response_class=HTMLResponse)
async def login(request: Request):
    return templates.TemplateResponse(
        request=request, name="login.html",
        context={
            "user": request.state.user,
        },
    )

@app.get("/styleguide", response_class=HTMLResponse)
async def read_item(request: Request):
    user = {} #utils.get_current_user() | {}
    events = [
        {
            "date": "Dec 12 2027",
            "title": "The Future of Wow",
            "presenter": "Basil Thai",
            "contact": "Maggie Elder",
            "songs": [
                {"song_number": 1234, "title": "Amazing Grace"},
                {"song_number": 4321, "title": "Amen"},
                {"song_number": 1010, "title": "Oh Happy Day"},
            ],
        },
        {
            "date": "Dec 19 2027",
            "title": "The History of Wow",
            "presenter": "Joe Smith",
            "contact": "Mary Johnson",
            "songs": [
                {"song_number": 1234, "title": "Amazing Grace"},
                {"song_number": 4321, "title": "Amen"},
                {"song_number": 1010, "title": "Oh Happy Day"},
                {"song_number": 1, "title": "Amazing Something Else That is Long"},
            ],
        },
        {
            "date": "Dec 26 2027",
            "title": "The Now of Wow",
            "presenter": "Joe Smith",
            "contact": "Mary Johnson",
            "songs": [],
        },
    ]
    response = templates.TemplateResponse(
        request=request, name="styleguide.html",
        context={
            "user": request.state.user,
            "module": "styleguide",
            "ws_type": "index",
            "ws_group": 0,
            "events": events,
        },
    )
    return response

@app.get("/song", response_class=HTMLResponse)
@app.get("/song/{id}", response_class=HTMLResponse)
async def song_get(request: Request, id: int = 0):
    return templates.TemplateResponse(
        request=request, name="index.html",
        context={
            "user": request.state.user,
            "module": "songs",
            "ws_type": "songs",
            "ws_group": id,
        },
    )

@app.get("/event", response_class=HTMLResponse)
@app.get("/event/{id}", response_class=HTMLResponse)
async def event_get(request: Request, id: int = 0):
    return templates.TemplateResponse(
        request=request, name="index.html",
        context={
            "user": request.state.user,
            "module": "events",
            "ws_type": "events",
            "ws_group": id,
        },
    )
