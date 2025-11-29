import psycopg2
import psycopg2.extras
import os
from . import utils
from psycopg2 import pool

DB_CONNECTION_STRING = os.environ["DB_CONNECTION_STRING"]

# Create a connection pool
connection_pool = pool.SimpleConnectionPool(
    1, 10, DB_CONNECTION_STRING
)

def dict_query(query, params=()):
  _conn = connection_pool.getconn()
  with _conn, _conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
    cur.execute(query, params, )
    if not cur.description is None:
        return cur.fetchall()
  connection_pool.putconn(_conn)

def query(query, params=()):
  _conn = connection_pool.getconn()
  with _conn, _conn.cursor() as cur:
    cur.execute(query, params, )
    if not cur.description is None:
        return cur.fetchall()
  connection_pool.putconn(_conn)


async def authenticate_user(username: str, password: str):
    users = query("SELECT password FROM userlogin WHERE login ilike %s", (username,))
    if not users: return False
    return utils.check_password(password, users[0][0])
