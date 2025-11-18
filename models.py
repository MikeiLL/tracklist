from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query
from sqlmodel import Field, Session, Relationship, SQLModel, create_engine, select, ForeignKey
from pydantic.json import pydantic_encoder
from datetime import datetime
from sqlalchemy import String, Column
from sqlalchemy.dialects.postgresql import ARRAY
import json
import os
from dotenv import load_dotenv

load_dotenv()


connect_args = {"options": "-c search_path=tracklist,public", }
engine = create_engine(os.environ["DB_CONNECTION_STRING"], connect_args=connect_args, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

class EventBase(SQLModel):
    date: datetime = Field()
    title: str | None = Field(default="To be determined", title="The name or title of the event", )
    description: str | None = Field()
    presenter: str | None = Field(default=None, title="Is there someone associated with this event", )
    contact: str | None = Field(default=None, title="Contact, point, service leader", )

    def json(self, **kwargs):
        dict_data = self.model_dump()
        dict_data['date'] = int(self.date.timestamp())
        return dict_data

class Event(EventBase, table=True):
    id: int | None = Field(default=None, primary_key=True)

    songuses: list["SongUse"] = Relationship(back_populates="event")

class EventPublic(EventBase):
    id: int

    songuses: list["SongUse"] = Relationship(back_populates="event")

class EventCreate(EventBase):
    pass

class EventUpdate(EventBase):
    date: datetime | None = None
    title: str | None = None
    description: str | None = None
    presenter: str | None = None

class SongBase(SQLModel):
    title: str = Field(default="Untitled", title="The title of the piece", index=True)
    credits: str | None = Field(default="Anonymous", title="Author(s), composer(s), etc...", )
    song_number: int | None = Field(default=None, title="1, 101, 1024, etc...", )
    notes: str | None = Field(default="", title="Arbitrary notes", )
    tags: list[str] | None = Field(default=None, sa_column=Column(ARRAY(String)), )

class Song(SongBase, table=True):
    id: int | None = Field(default=None, primary_key=True)

    songuses: list["SongUse"] = Relationship(back_populates="song")

class SongPublic(SongBase):
    id: int

    songuses: list["SongUse"] = Relationship(back_populates="song")

class SongCreate(SongBase):
    pass

class SongUpdate(SongBase):
    title: str | None = Field(default="Untitled")
    credits: str | None = Field(default="")

# TODO https://stackoverflow.com/a/74852191/2223106
class SongUseBase(SQLModel):
    event_id: int = Field(foreign_key="event.id", title="When used?")
    song_id: int = Field(foreign_key="song.id", title="Which piece?")
    usage: str | None = Field(default=None, title="Intro, Offertory, Meditation, etc...", )
    notes: str | None = Field(default=None, title="Alernate key, instrumentation, etc...", )

class SongUse(SongUseBase, table=True):
    id: int | None = Field(default=None, primary_key=True)

    event: Event = Relationship(back_populates="songuses")
    song: Song = Relationship(back_populates="songuses")

class SongUsePublic(SongUseBase):
    id: int

    event_id: Event = Relationship(back_populates="songuses")
    song_id: Song = Relationship(back_populates="songuses")

class SongUseCreate(SongUseBase):
    pass

class SongUseUpdate(SongUseBase):
    event_id: int | None = None
    song_id: int | None = None
    usage: str | None = None


class EventSongsBase(SQLModel):
    title: str = Field(default="Untitled", title="The title of the piece", index=True)
    """credits: str | None = Field(default="Anonymous", title="Author(s), composer(s), etc...", )
    song_number: int | None = Field(default=None, title="1, 101, 1024, etc...", )
    notes: str | None = Field(default="", title="Arbitrary notes", ) """

class EventSongsPublic(EventSongsBase):
    pass
