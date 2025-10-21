from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query
from sqlmodel import Field, Session, SQLModel, create_engine, select, ForeignKey
from datetime import datetime
from config import settings

connect_args = {"options": "-c search_path=tracklist,public", }
engine = create_engine(settings.db_connection_string, connect_args=connect_args, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

class Event(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    date: datetime = Field()
    title: str = Field(default="To be determined", title="The name or title of the event", )
    description: str = Field()
    presenter: str = Field(default=None, title="Is there someone associated with this event", )

class Song(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(default="Untitled", title="The title of the piece", )
    credits: str = Field(default="Anonymous", title="Author(s), composer(s), etc...", )

class SongUse(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    event: int = Field(ForeignKey(Event.id), title="When used?")
    song: int = Field(ForeignKey(Song.id), title="Which piece?")
    usage: str = Field(default=None, title="Intro, Offertory, Meditation, etc...", )

create_db_and_tables()
