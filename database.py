import psycopg2
import psycopg2.extras
import os
from . import utils
from psycopg2.pool import ThreadedConnectionPool as _ThreadedConnectionPool
from threading import Semaphore

DB_CONNECTION_STRING = os.environ["DB_CONNECTION_STRING"]

# source https://stackoverflow.com/a/53437049/2223106
class ThreadedConnectionPool(_ThreadedConnectionPool):
    def __init__(self, minconn, maxconn, *args, **kwargs):
        self._semaphore = Semaphore(maxconn)
        super().__init__(minconn, maxconn, *args, **kwargs)

    def getconn(self, *args, **kwargs):
        self._semaphore.acquire()
        try:
            return super().getconn(*args, **kwargs)
        except:
            self._semaphore.release()
            raise

    def putconn(self, *args, **kwargs):
        try:
            super().putconn(*args, **kwargs)
        finally:
            self._semaphore.release()

# Create a connection pool
connection_pool = ThreadedConnectionPool(
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
