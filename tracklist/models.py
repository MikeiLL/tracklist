from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query
from sqlmodel import Field, Session, SQLModel, create_engine, select
from datetime import datetime

#TODO https://fastapi.tiangolo.com/advanced/settings/#read-settings-from-env
connect_args = {"options": "-c search_path=tracklist,public", }
engine = create_engine("postgresql://mikekilmer:@localhost/playground", connect_args=connect_args, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

class Event(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    date: datetime = Field()
    title: str = Field(default="To be determined", title="The name or title of the event", )
    description: str = Field()
    presenter: str = Field(default=None, title="Is there someone associated with this event", )

create_db_and_tables()
