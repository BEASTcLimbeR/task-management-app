# Personal Task Manager

I made this as a small personal task list. The backend is a Flask REST API with SQLite. The frontend is Next.js, and it talks to that API over HTTP. The browser never opens the database.

Live demo: https://rutvij-task-manager-app.vercel.app

## What it can do

You can add a task (title, description, priority, due date), edit it, tick it off, or delete it. The list can be filtered to All, Pending, or Completed, and the tabs show how many tasks are in each group.

Ticking a task off, editing, or deleting it updates the list straight away; if the API call fails, the old data comes back and you see an error. Delete has a short Undo. You can search and sort on the page, and the filter, search, and sort stay in the URL so a refresh or a shared link keeps the same view. Press ? for keyboard shortcuts. There is a dark mode toggle as well.

The API checks the data before it is saved. If something is wrong (empty title, bad date, and so on) you get a JSON error back. On the page, a task with a due date before today is marked overdue until you complete it.

## What I used

- Backend: Python 3, Flask, flask-cors
- Database: SQLite through the built-in `sqlite3` module (nothing extra to install)
- Frontend: Next.js (App Router), TypeScript, Tailwind CSS
- Tests: pytest

## How the pieces fit

The UI runs on port 3000. It calls `fetch` against the Flask app on port 5001. Flask reads and writes `backend/tasks.db`.

```
Next.js (localhost:3000)  -->  JSON  -->  Flask (127.0.0.1:5001)  -->  tasks.db
```

## What you need installed

Python 3.10+, Node.js 18.18+, npm, and Git. SQLite comes with Python.

## Running it

Use two terminals, both started from the project folder.

**1. API**

macOS / Linux:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Windows (Command Prompt):

```bat
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

That should print something about `http://127.0.0.1:5001`. The SQLite file is created on first start if it is not there yet.

**2. Frontend**

```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:3000

I put the API on 5001 because on a Mac, port 5000 is often taken by AirPlay Receiver. If you need another port, start Flask with `PORT=5002 python app.py` (on Windows: `set PORT=5002` then `python app.py`). Copy `frontend/.env.example` to `frontend/.env.local` and set `NEXT_PUBLIC_API_URL` to match, then restart `npm run dev`.

```bash
cd frontend
cp .env.example .env.local
```

Windows: `copy .env.example .env.local`

## Tests

With the backend venv activated:

```bash
cd backend
python -m pytest -v
```

pytest points at a temp file, so your real `tasks.db` is left alone.

## API

JSON in, JSON out, except DELETE which has an empty body. Failures look like `{"error": "Title is required."}` with 400 (bad request) or 404 (missing task).

| Method | URL | What it does | OK |
|---|---|---|---|
| GET | `/api/tasks` | List. Query `status=all`, `pending`, or `completed` (default `all`) | 200 |
| GET | `/api/tasks/<id>` | One task | 200 |
| POST | `/api/tasks` | Create | 201 |
| PUT | `/api/tasks/<id>` | Replace title, description, priority, due date. Leaves `completed` as it is. | 200 |
| PATCH | `/api/tasks/<id>` | Change only the fields you send, e.g. `{"completed": true}` | 200 |
| DELETE | `/api/tasks/<id>` | Remove it | 204 |

Anything other than `all` / `pending` / `completed` for `status` is a 400.

Create:

```bash
curl -s -X POST http://127.0.0.1:5001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Finish homework","description":"Chapter 4","priority":"high","due_date":"2026-10-01"}'
```

You should get something like:

```json
{
  "id": 1,
  "title": "Finish homework",
  "description": "Chapter 4",
  "priority": "high",
  "due_date": "2026-10-01",
  "completed": false,
  "created_at": "2026-09-28T09:00:00Z",
  "updated_at": "2026-09-28T09:00:00Z"
}
```

Pending list:

```bash
curl -s "http://127.0.0.1:5001/api/tasks?status=pending"
```

Mark done:

```bash
curl -s -X PATCH http://127.0.0.1:5001/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

Edit (this does not flip `completed`):

```bash
curl -s -X PUT http://127.0.0.1:5001/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Finish homework (final)","description":"Chapter 4","priority":"medium","due_date":"2026-10-02"}'
```

Delete (prints the status code):

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://127.0.0.1:5001/api/tasks/1
```

## `tasks` table

| Column | Type | Notes |
|---|---|---|
| id | INTEGER | Primary key, auto increment |
| title | TEXT | Required |
| description | TEXT | Required, default empty string |
| priority | TEXT | `low`, `medium`, or `high` (default medium) |
| due_date | TEXT | Optional, `YYYY-MM-DD` |
| completed | INTEGER | 0 or 1 (default 0) |
| created_at | TEXT | UTC time |
| updated_at | TEXT | UTC time |

## Folder layout

```
task-management-app/
├── README.md
├── .gitignore
├── backend/
│   ├── app.py
│   ├── db.py
│   ├── requirements.txt
│   └── tests/test_api.py
└── frontend/
    ├── app/
    ├── components/
    ├── lib/api.ts
    ├── .env.example
    └── package.json
```

`venv/`, `node_modules/`, `.next/`, and `tasks.db` stay on your machine. They are in `.gitignore`.

## Why some things are the way they are

PUT is for the edit form (the details). PATCH is for the checkbox, so completing a task does not wipe the title. I used `?` placeholders in SQL so values cannot change the query. The API still validates even if you skip the UI and hit it with curl. The table also has CHECK constraints on priority and completed. CORS is limited to the Next.js origin. I did not use an ORM; the SQL is in `db.py` / `app.py` so it is easy to read. Next.js does not talk to SQLite and I did not put API routes in Next.js. Flask is the backend.

## If I spent more time on this

Login would be the first thing. After that, search, paging, and moving off SQLite if it ever had to run as a real hosted app. Docker would make the two-terminal setup nicer too.

## Deployment

I run the API on PythonAnywhere and the UI on Vercel.

On PythonAnywhere: clone this repo, make a venv, `pip install -r requirements.txt`, then add a web app with manual configuration whose source folder is `backend/`. The WSGI file should import `app` from `app.py` (the host loads the module; it does not run `python app.py`). Set `FRONTEND_ORIGINS` to your Vercel URL (no trailing slash), for example `https://your-app.vercel.app`.

On Vercel: set the root directory to `frontend` and set `NEXT_PUBLIC_API_URL` to the PythonAnywhere URL, for example `https://yourusername.pythonanywhere.com`.

SQLite works on PythonAnywhere because the account has a persistent disk, so `backend/tasks.db` stays between reloads.
