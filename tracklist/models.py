from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query
from sqlmodel import Field, Session, SQLModel, create_engine, select, ForeignKey
from datetime import datetime
from config import settings

connect_args = {"options": "-c search_path=tracklist,public", }
engine = create_engine(settings.db_connection_string, connect_args=connect_args, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

class EventBase(SQLModel):
    date: datetime = Field()
    title: str = Field(default="To be determined", title="The name or title of the event", )
    description: str = Field()
    presenter: str = Field(default=None, title="Is there someone associated with this event", )

class Event(EventBase, table=True):
    id: int | None = Field(default=None, primary_key=True)

class EventPublic(EventBase):
    id: int

class EventCreate(EventBase):
    date: datetime = Field()
    title: str = Field(default="To be determined", title="The name or title of the event", )
    description: str = Field()
    presenter: str = Field(default=None, title="Is there someone associated with this event", )

class EventUpdate(EventBase):
    date: datetime = Field()
    title: str = Field(default="To be determined", title="The name or title of the event", )
    description: str = Field()
    presenter: str = Field(default=None, title="Is there someone associated with this event", )

class SongBase(SQLModel):
    title: str = Field(default="Untitled", title="The title of the piece", index=True)
    credits: str = Field(default="Anonymous", title="Author(s), composer(s), etc...", )

class Song(SongBase, table=True):
    id: int | None = Field(default=None, primary_key=True)

class SongPublic(SongBase):
    id: int

class SongCreate(SongBase):
    pass

class SongUpdate(SongBase):
    title: str | None = None
    credits: str | None = None

class SongUse(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    event: int = Field(ForeignKey(Event.id), title="When used?")
    song: int = Field(ForeignKey(Song.id), title="Which piece?")
    usage: str = Field(default=None, title="Intro, Offertory, Meditation, etc...", )
