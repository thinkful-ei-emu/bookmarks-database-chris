CREATE TABLE bookmarks (
    id uuid unique,
    title text not NULL,
    description text,
    url text not null,
    rating INTEGER default 1,
    CONSTRAINT rating_chk CHECK (rating BETWEEN 1 AND 5)
);
