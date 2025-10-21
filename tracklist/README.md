# Track and Analyze Musical Components of an Event

## Database

tracklist schema, playground database

create table event
  id
  date
  title
  description
  presenter
  date timestamp default now

create table song
  id
  title default 'untitled'
  author default ''

create table songuse
  id
  event references event
  song references song
  usage string eg 'offertory', 'opening', etc...
