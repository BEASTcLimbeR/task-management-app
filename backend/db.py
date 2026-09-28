import os
import sqlite3

# Use tasks.db next to this file, unless TASKS_DB points somewhere else
DB_PATH = os.environ.get(
    "TASKS_DB",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "tasks.db"),
)


# Open the database and return rows we can read by column name
def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


# Create the tasks table if it does not exist yet
def init_db():
    connection = get_connection()
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
            due_date TEXT,
            completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    connection.commit()
    connection.close()


# Turn a database row into a dict, with completed as True or False
def row_to_dict(row):
    task = dict(row)
    task["completed"] = bool(task["completed"])
    return task


if __name__ == "__main__":
    init_db()
    print("Database ready at", DB_PATH)
