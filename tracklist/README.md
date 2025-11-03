# Track and Analyze Musical Components of an Event

## Database

- See .env, Models.py and Config.py

## Cookies, JWTs, expiration, authentication
*Traditional session cookies* are the normal meaning of a "magic" cookie.
Like a raffle ticket that has a unique identifier on it (one on the server,
one on the client). So the server knows who you are because you have this
unique cookie.
With traditional cookie you can just remove a particular number from set of
valid numbers and deny further access.
A *JWT is different* because its security features are universal (per server).
Think of govt currency notes:
    made of a particular material
    metallic strip
    hologram
    raised ink
    uv sensitive ink
    etc...
You can't forge them because you won't get all of that right, but it does mean
that it is very hard to mark a note a "stolen" so that it won't be accepted.
The only option is the serial number (and then you need a massive,
massive revocation list).



## Views

- all songs
- - filter, sort
- single song

- song uses
- - eg: happy birthday
- - - list of dates

- event list
- - filter, sort
- single event with songs_uses
- multiple events with song_uses
- calendar view (list could be fine)

## Actions
- add song
- edit song
- delete song
- add, etit, delete event
