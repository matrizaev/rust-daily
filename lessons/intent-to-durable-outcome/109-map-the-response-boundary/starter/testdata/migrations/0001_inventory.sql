CREATE TABLE inventory (
    item_id INTEGER NOT NULL PRIMARY KEY CHECK (item_id > 0),
    available INTEGER NOT NULL CHECK (available >= 0)
);

CREATE TABLE reservations (
    reservation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL REFERENCES inventory(item_id) DEFERRABLE INITIALLY DEFERRED,
    quantity INTEGER NOT NULL CHECK (quantity > 0)
);

CREATE INDEX reservations_item_id_idx ON reservations(item_id);
