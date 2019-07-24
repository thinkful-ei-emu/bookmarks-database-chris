CREATE TABLE bookmarks (
    id uuid unique,
    title text not NULL,
    description text,
    url text not null,
    rating INTEGER default 1
);
