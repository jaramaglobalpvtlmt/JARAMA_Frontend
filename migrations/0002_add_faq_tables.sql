CREATE TABLE faq_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_faq_categories_active_order
ON faq_categories(is_active, display_order);

CREATE TABLE faqs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    button_label TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    action_type TEXT NOT NULL DEFAULT 'ANSWER',
    action_value TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id)
        REFERENCES faq_categories(id)
);

CREATE INDEX idx_faqs_category
ON faqs(category_id);

CREATE INDEX idx_faqs_active_order
ON faqs(is_active, display_order);
