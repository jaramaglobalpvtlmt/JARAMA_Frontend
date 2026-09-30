CREATE TABLE enquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enquiry_number TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    query TEXT NOT NULL
);