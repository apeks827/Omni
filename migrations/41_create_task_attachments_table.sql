CREATE TABLE task_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX idx_task_attachments_user_id ON task_attachments(user_id);
CREATE INDEX idx_task_attachments_uploaded_at ON task_attachments(uploaded_at DESC);

COMMENT ON TABLE task_attachments IS 'File attachments for tasks (images, PDFs, docs, spreadsheets)';
COMMENT ON COLUMN task_attachments.file_size IS 'File size in bytes, max 10MB per file';
