import psycopg2
import psycopg2.extras
import os



DB_CONNECTION_STRING = os.environ["DB_CONNECTION_STRING"]
_conn = psycopg2.connect((DB_CONNECTION_STRING))

def dict_query(query, params=()):
  with _conn, _conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
    cur.execute(query, params, )
    if not cur.description is None:
        return cur.fetchall()

def query(query, params=()):
  with _conn, _conn.cursor() as cur:
    cur.execute(query, params, )
    if not cur.description is None:
        return cur.fetchall()
