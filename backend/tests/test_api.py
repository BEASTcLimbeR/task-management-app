import pytest


# Each test gets its own empty database file, then a Flask test client
@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("TASKS_DB", str(tmp_path / "tasks.db"))
    from app import create_app

    application = create_app()
    application.config["TESTING"] = True
    return application.test_client()


# Send POST /api/tasks with a title plus any extra fields
def post_task(client, **fields):
    payload = {"title": "My task"}
    payload.update(fields)
    return client.post("/api/tasks", json=payload)


def test_create_returns_201_and_fields(client):
    response = client.post(
        "/api/tasks",
        json={
            "title": "Finish homework",
            "description": "Chapter 4",
            "priority": "high",
            "due_date": "2026-10-01",
            "completed": False,
        },
    )
    assert response.status_code == 201
    task = response.get_json()
    assert task["id"] == 1
    assert task["title"] == "Finish homework"
    assert task["description"] == "Chapter 4"
    assert task["priority"] == "high"
    assert task["due_date"] == "2026-10-01"
    assert task["completed"] is False
    assert "created_at" in task
    assert "updated_at" in task


def test_create_uses_defaults(client):
    response = post_task(client)
    assert response.status_code == 201
    task = response.get_json()
    assert task["description"] == ""
    assert task["priority"] == "medium"
    assert task["due_date"] is None
    assert task["completed"] is False


def test_create_missing_title(client):
    response = client.post("/api/tasks", json={})
    assert response.status_code == 400
    assert response.get_json() == {"error": "Title is required."}


def test_create_blank_title(client):
    response = client.post("/api/tasks", json={"title": "   "})
    assert response.status_code == 400
    assert response.get_json() == {"error": "Title cannot be empty."}


def test_create_bad_priority(client):
    response = post_task(client, priority="urgent")
    assert response.status_code == 400
    assert response.get_json() == {"error": "Priority must be low, medium, or high."}


def test_create_bad_date(client):
    response = post_task(client, due_date="01-10-2026")
    assert response.status_code == 400
    assert response.get_json() == {"error": "Due date must be YYYY-MM-DD."}


def test_create_non_boolean_completed(client):
    response = post_task(client, completed=1)
    assert response.status_code == 400
    assert response.get_json() == {"error": "Completed must be true or false."}


def test_create_unknown_field(client):
    response = post_task(client, extra="nope")
    assert response.status_code == 400
    assert response.get_json() == {"error": "Unknown field(s): extra."}


def test_list_all(client):
    post_task(client, title="First")
    post_task(client, title="Second")
    response = client.get("/api/tasks")
    assert response.status_code == 200
    titles = [task["title"] for task in response.get_json()]
    assert titles == ["Second", "First"]


def test_filter_pending(client):
    post_task(client, title="Pending task")
    created = post_task(client, title="Done task").get_json()
    client.patch("/api/tasks/" + str(created["id"]), json={"completed": True})
    response = client.get("/api/tasks?status=pending")
    assert response.status_code == 200
    tasks = response.get_json()
    assert len(tasks) == 1
    assert tasks[0]["title"] == "Pending task"
    assert tasks[0]["completed"] is False


def test_filter_completed(client):
    post_task(client, title="Pending task")
    created = post_task(client, title="Done task").get_json()
    client.patch("/api/tasks/" + str(created["id"]), json={"completed": True})
    response = client.get("/api/tasks?status=completed")
    assert response.status_code == 200
    tasks = response.get_json()
    assert len(tasks) == 1
    assert tasks[0]["title"] == "Done task"
    assert tasks[0]["completed"] is True


def test_invalid_status(client):
    response = client.get("/api/tasks?status=later")
    assert response.status_code == 400
    assert response.get_json() == {"error": "status must be all, pending, or completed."}


def test_get_one(client):
    created = post_task(client, title="One task").get_json()
    response = client.get("/api/tasks/" + str(created["id"]))
    assert response.status_code == 200
    assert response.get_json()["title"] == "One task"


def test_get_missing(client):
    response = client.get("/api/tasks/99")
    assert response.status_code == 404
    assert response.get_json() == {"error": "Task 99 not found."}


def test_put_edits_details_and_keeps_completed(client):
    created = post_task(
        client, title="Old title", description="Old notes", priority="low"
    ).get_json()
    client.patch("/api/tasks/" + str(created["id"]), json={"completed": True})
    response = client.put(
        "/api/tasks/" + str(created["id"]),
        json={
            "title": "New title",
            "description": "New notes",
            "priority": "high",
            "due_date": "2026-11-01",
        },
    )
    assert response.status_code == 200
    task = response.get_json()
    assert task["title"] == "New title"
    assert task["description"] == "New notes"
    assert task["priority"] == "high"
    assert task["due_date"] == "2026-11-01"
    assert task["completed"] is True


def test_patch_completed_only(client):
    created = post_task(client, title="Stay the same", description="Keep me").get_json()
    response = client.patch(
        "/api/tasks/" + str(created["id"]), json={"completed": True}
    )
    assert response.status_code == 200
    task = response.get_json()
    assert task["completed"] is True
    assert task["title"] == "Stay the same"
    assert task["description"] == "Keep me"


def test_patch_empty(client):
    created = post_task(client).get_json()
    response = client.patch("/api/tasks/" + str(created["id"]), json={})
    assert response.status_code == 400
    assert response.get_json() == {"error": "Nothing to update."}


def test_update_missing(client):
    put_response = client.put("/api/tasks/99", json={"title": "Nope"})
    assert put_response.status_code == 404
    assert put_response.get_json() == {"error": "Task 99 not found."}
    patch_response = client.patch("/api/tasks/99", json={"completed": True})
    assert patch_response.status_code == 404
    assert patch_response.get_json() == {"error": "Task 99 not found."}


def test_delete_then_404(client):
    created = post_task(client).get_json()
    response = client.delete("/api/tasks/" + str(created["id"]))
    assert response.status_code == 204
    assert response.data == b""
    again = client.delete("/api/tasks/" + str(created["id"]))
    assert again.status_code == 404
    assert again.get_json() == {
        "error": "Task " + str(created["id"]) + " not found."
    }


def test_data_persists_across_two_app_instances(tmp_path, monkeypatch):
    db_file = str(tmp_path / "shared.db")
    monkeypatch.setenv("TASKS_DB", db_file)
    from app import create_app

    first_app = create_app()
    first_client = first_app.test_client()
    created = first_client.post("/api/tasks", json={"title": "Still here"}).get_json()

    second_app = create_app()
    second_client = second_app.test_client()
    response = second_client.get("/api/tasks/" + str(created["id"]))
    assert response.status_code == 200
    assert response.get_json()["title"] == "Still here"
