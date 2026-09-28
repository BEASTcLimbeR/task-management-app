"""
Flask REST API for tasks.

Endpoints:
  GET    /api/tasks?status=all|pending|completed  — list tasks
  GET    /api/tasks/<id>                          — get one task
  POST   /api/tasks                               — create a task
  PUT    /api/tasks/<id>                          — replace title, description, priority, due_date
  PATCH  /api/tasks/<id>                          — update only the fields sent
  DELETE /api/tasks/<id>                          — delete a task
"""

import datetime
import os

from flask import Flask, jsonify, request
from flask_cors import CORS

from db import get_connection, init_db, row_to_dict

# Fields the client is allowed to send in JSON
ALLOWED_FIELDS = {"title", "description", "priority", "due_date", "completed"}
ALLOWED_PRIORITIES = {"low", "medium", "high"}
# Column names we may put in UPDATE — never copy raw user keys into SQL
TASK_COLUMNS = ("title", "description", "priority", "due_date", "completed")


# Raised when the request body fails a validation rule
class ValidationError(Exception):
    def __init__(self, message):
        super().__init__(message)
        self.message = message


# Turn a ValidationError into JSON {"error": "..."} with status 400
def handle_validation_error(error):
    return jsonify({"error": error.message}), 400


# Return the current UTC time as an ISO string, e.g. 2026-09-28T09:00:00Z
def utc_now():
    return (
        datetime.datetime.now(datetime.timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )


# Check the JSON body and return a clean dict of fields to save
def validate_task(data, partial):
    if not isinstance(data, dict):
        raise ValidationError("Request body must be a JSON object.")

    if partial and len(data) == 0:
        raise ValidationError("Nothing to update.")

    unknown = [key for key in data if key not in ALLOWED_FIELDS]
    if unknown:
        raise ValidationError("Unknown field(s): " + ", ".join(sorted(unknown)) + ".")

    result = {}

    if "title" in data:
        title = data["title"]
        if not isinstance(title, str):
            raise ValidationError("Title must be a string.")
        title = title.strip()
        if title == "":
            raise ValidationError("Title cannot be empty.")
        if len(title) > 200:
            raise ValidationError("Title must be 200 characters or fewer.")
        result["title"] = title
    elif not partial:
        raise ValidationError("Title is required.")

    if "description" in data:
        description = data["description"]
        if not isinstance(description, str):
            raise ValidationError("Description must be a string.")
        result["description"] = description
    elif not partial:
        result["description"] = ""

    if "priority" in data:
        priority = data["priority"]
        if priority not in ALLOWED_PRIORITIES:
            raise ValidationError("Priority must be low, medium, or high.")
        result["priority"] = priority
    elif not partial:
        result["priority"] = "medium"

    if "due_date" in data:
        due_date = data["due_date"]
        if due_date is None or due_date == "":
            result["due_date"] = None
        else:
            if not isinstance(due_date, str):
                raise ValidationError("Due date must be YYYY-MM-DD.")
            try:
                datetime.date.fromisoformat(due_date)
            except ValueError:
                raise ValidationError("Due date must be YYYY-MM-DD.")
            result["due_date"] = due_date
    elif not partial:
        result["due_date"] = None

    if "completed" in data:
        completed = data["completed"]
        if not isinstance(completed, bool):
            raise ValidationError("Completed must be true or false.")
        result["completed"] = completed

    return result


# Load one task by id, or None if it does not exist
def fetch_task(connection, task_id):
    return connection.execute(
        "SELECT * FROM tasks WHERE id = ?", (task_id,)
    ).fetchone()


# Build a 404 JSON body for a missing task
def task_not_found(task_id):
    return jsonify({"error": "Task " + str(task_id) + " not found."}), 404


# Save changed columns using only names from TASK_COLUMNS
def apply_update(connection, task_id, fields):
    assignments = []
    values = []
    for column in TASK_COLUMNS:
        if column in fields:
            assignments.append(column + " = ?")
            value = fields[column]
            if column == "completed":
                value = 1 if value else 0
            values.append(value)
    assignments.append("updated_at = ?")
    values.append(utc_now())
    values.append(task_id)
    sql = "UPDATE tasks SET " + ", ".join(assignments) + " WHERE id = ?"
    connection.execute(sql, values)


# List tasks, newest pending first, with optional status filter
def list_tasks():
    status = request.args.get("status", "all")
    if status not in ("all", "pending", "completed"):
        return jsonify({"error": "status must be all, pending, or completed."}), 400

    order_sql = """
        ORDER BY completed ASC,
                 CASE WHEN due_date IS NULL THEN 1 ELSE 0 END ASC,
                 due_date ASC,
                 id DESC
    """

    connection = get_connection()
    if status == "pending":
        rows = connection.execute(
            "SELECT * FROM tasks WHERE completed = ? " + order_sql, (0,)
        ).fetchall()
    elif status == "completed":
        rows = connection.execute(
            "SELECT * FROM tasks WHERE completed = ? " + order_sql, (1,)
        ).fetchall()
    else:
        rows = connection.execute("SELECT * FROM tasks " + order_sql).fetchall()
    connection.close()
    return jsonify([row_to_dict(row) for row in rows]), 200


# Create a new task and return it
def create_task():
    data = request.get_json(silent=True)
    fields = validate_task(data, partial=False)
    now = utc_now()
    connection = get_connection()
    cursor = connection.execute(
        """
        INSERT INTO tasks (title, description, priority, due_date, completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            fields["title"],
            fields["description"],
            fields["priority"],
            fields["due_date"],
            1 if fields.get("completed", False) else 0,
            now,
            now,
        ),
    )
    connection.commit()
    row = fetch_task(connection, cursor.lastrowid)
    connection.close()
    return jsonify(row_to_dict(row)), 201


# Return one task by id
def get_task(task_id):
    connection = get_connection()
    row = fetch_task(connection, task_id)
    connection.close()
    if row is None:
        return task_not_found(task_id)
    return jsonify(row_to_dict(row)), 200


# Replace a task's details; completed is never changed here
def replace_task(task_id):
    data = request.get_json(silent=True)
    fields = validate_task(data, partial=False)
    fields.pop("completed", None)
    connection = get_connection()
    row = fetch_task(connection, task_id)
    if row is None:
        connection.close()
        return task_not_found(task_id)
    apply_update(connection, task_id, fields)
    connection.commit()
    row = fetch_task(connection, task_id)
    connection.close()
    return jsonify(row_to_dict(row)), 200


# Update only the fields the client sent
def patch_task(task_id):
    data = request.get_json(silent=True)
    fields = validate_task(data, partial=True)
    connection = get_connection()
    row = fetch_task(connection, task_id)
    if row is None:
        connection.close()
        return task_not_found(task_id)
    apply_update(connection, task_id, fields)
    connection.commit()
    row = fetch_task(connection, task_id)
    connection.close()
    return jsonify(row_to_dict(row)), 200


# Delete a task
def delete_task(task_id):
    connection = get_connection()
    row = fetch_task(connection, task_id)
    if row is None:
        connection.close()
        return task_not_found(task_id)
    connection.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    connection.commit()
    connection.close()
    return ("", 204)


# Build a Flask app, turn on CORS for the Next.js frontend, and create the table
def create_app():
    application = Flask(__name__)
    CORS(
        application,
        resources={
            r"/api/*": {
                "origins": [
                    "http://localhost:3000",
                    "http://127.0.0.1:3000",
                ]
            }
        },
    )
    application.register_error_handler(ValidationError, handle_validation_error)
    application.add_url_rule("/api/tasks", "list_tasks", list_tasks, methods=["GET"])
    application.add_url_rule("/api/tasks", "create_task", create_task, methods=["POST"])
    application.add_url_rule(
        "/api/tasks/<int:task_id>", "get_task", get_task, methods=["GET"]
    )
    application.add_url_rule(
        "/api/tasks/<int:task_id>", "replace_task", replace_task, methods=["PUT"]
    )
    application.add_url_rule(
        "/api/tasks/<int:task_id>", "patch_task", patch_task, methods=["PATCH"]
    )
    application.add_url_rule(
        "/api/tasks/<int:task_id>", "delete_task", delete_task, methods=["DELETE"]
    )
    init_db()
    return application


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", 5001)), debug=True)
