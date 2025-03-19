-- Project information
CREATE TABLE IF NOT EXISTS projects (
    project_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Memory entries (conversations, code, decisions, etc.)
CREATE TABLE IF NOT EXISTS memories (
    memory_id INTEGER PRIMARY KEY,
    project_id INTEGER,
    content TEXT NOT NULL,
    content_type TEXT CHECK(content_type IN ('conversation', 'code', 'decision', 'reference')),
    metadata TEXT, -- JSON field for additional metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    embedding_id INTEGER,
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (embedding_id) REFERENCES embeddings(embedding_id)
);

-- Embeddings for semantic search
CREATE TABLE IF NOT EXISTS embeddings (
    embedding_id INTEGER PRIMARY KEY,
    vector BLOB NOT NULL,  -- Store embedding vectors as binary blobs
    dimensions INTEGER NOT NULL DEFAULT 768  -- Default to Ollama's nomic-embed-text dimensions
);

-- Tags for additional metadata and organization
CREATE TABLE IF NOT EXISTS tags (
    tag_id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

-- Many-to-many relationship table for tagging memories
CREATE TABLE IF NOT EXISTS memory_tags (
    memory_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (memory_id, tag_id),
    FOREIGN KEY (memory_id) REFERENCES memories(memory_id),
    FOREIGN KEY (tag_id) REFERENCES tags(tag_id)
);

-- Relationships between memories
CREATE TABLE IF NOT EXISTS memory_relationships (
    relationship_id INTEGER PRIMARY KEY,
    source_memory_id INTEGER NOT NULL,
    target_memory_id INTEGER NOT NULL,
    relationship_type TEXT NOT NULL, -- e.g., 'references', 'builds_on', 'contradicts'
    FOREIGN KEY (source_memory_id) REFERENCES memories(memory_id),
    FOREIGN KEY (target_memory_id) REFERENCES memories(memory_id)
); 