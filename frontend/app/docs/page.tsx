import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { Footer } from "@/components/ui/footer-section";

export const metadata: Metadata = {
  title: "Documentation · Task Manager App",
};

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "architecture", label: "Architecture" },
  { id: "tech-stack", label: "Tech stack" },
  { id: "api", label: "API reference" },
  { id: "database", label: "Database" },
  { id: "features", label: "Features" },
  { id: "deployment", label: "Deployment" },
  { id: "run-locally", label: "Run locally" },
] as const;

const LINK_CLASS =
  "rounded-sm text-sky-700 underline decoration-sky-700/30 underline-offset-2 hover:decoration-sky-700 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none dark:text-sky-400 dark:decoration-sky-400/40 dark:hover:decoration-sky-400 dark:focus-visible:ring-sky-400";

const TABLE_WRAP = "mt-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700";
const TABLE = "w-full min-w-[32rem] border-collapse text-left text-sm";
const TH = "border-b border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";
const TD = "border-b border-slate-200 px-3 py-2 align-top text-slate-700 dark:border-slate-700 dark:text-slate-300";
const PRE =
  "mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";
const H2 = "scroll-mt-6 text-xl font-semibold text-slate-900 dark:text-slate-100";
const BOX =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";

// Static documentation for the Task Manager App, written from this repo
export default function DocsPage() {
  return (
    <>
      <main className="mx-auto w-full max-w-[760px] px-4 py-8">
        <header className="mb-8 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href="/" className={`${LINK_CLASS} text-sm`}>
              ← Back to app
            </Link>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Documentation
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              How this personal task manager is built, from the browser down to SQLite.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <nav aria-label="Table of contents" className="mb-10 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
            Contents
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
            {TOC.map((item) => (
              <li key={item.id}>
                <a className={LINK_CLASS} href={`#${item.id}`}>
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="space-y-10 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <section id="overview">
            <h2 className={H2}>Overview</h2>
            <p className="mt-3">
              Task Manager App is a small personal task list. You can add a task (title, description, priority, due date), edit it, tick it off, or delete it. The list can be filtered to All, Pending, or Completed, and the tabs show how many tasks are in each group.
            </p>
            <p className="mt-3">
              On top of those five actions, the UI updates the list straight away when you tick, edit, or delete; if the API call fails, the old data comes back and you see an error. Delete has a short Undo. You can search and sort on the page, and the filter, search, and sort stay in the URL. Press ? for keyboard shortcuts. There is a dark mode toggle. The API checks the data before it is saved; a task with a due date before today is marked overdue until you complete it.
            </p>
          </section>

          <section id="architecture">
            <h2 className={H2}>Architecture</h2>
            <p className="mt-3">
              The UI runs in the browser as a Next.js app. It calls <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">fetch</code> against a Flask REST API. Flask reads and writes <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">backend/tasks.db</code>. Live, the frontend is on Vercel and the API is on PythonAnywhere.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <div className={BOX}>Browser</div>
              <span aria-hidden="true">→</span>
              <div className={BOX}>Next.js (Vercel)</div>
              <span aria-hidden="true">→</span>
              <div className={BOX}>fetch JSON</div>
              <span aria-hidden="true">→</span>
              <div className={BOX}>Flask REST API (PythonAnywhere)</div>
              <span aria-hidden="true">→</span>
              <div className={BOX}>SQLite (tasks.db)</div>
            </div>
            <p className="mt-4">
              The frontend never touches the database. Next.js does not talk to SQLite and there are no Next.js API routes; Flask is the backend.
            </p>
          </section>

          <section id="tech-stack">
            <h2 className={H2}>Tech stack</h2>
            <div className={TABLE_WRAP}>
              <table className={TABLE}>
                <thead>
                  <tr>
                    <th className={TH}>Layer</th>
                    <th className={TH}>Technology</th>
                    <th className={TH}>Why chosen</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={TD}>Frontend</td>
                    <td className={TD}>Next.js App Router, TypeScript, Tailwind CSS</td>
                    <td className={TD}>
                      The UI is a Next.js App Router app. It talks to Flask over HTTP with <code>fetch</code> and never opens the database.
                    </td>
                  </tr>
                  <tr>
                    <td className={TD}>Backend</td>
                    <td className={TD}>Flask + flask-cors</td>
                    <td className={TD}>
                      Flask is the REST API. CORS is limited to the Next.js origin (local URLs, or <code>FRONTEND_ORIGINS</code> in production).
                    </td>
                  </tr>
                  <tr>
                    <td className={TD}>Database</td>
                    <td className={TD}>SQLite via sqlite3 (no ORM)</td>
                    <td className={TD}>
                      SQLite comes with Python, so there is nothing extra to install. SQL lives in <code>db.py</code> / <code>app.py</code> so it is easy to read. Queries use <code>?</code> placeholders.
                    </td>
                  </tr>
                  <tr>
                    <td className={`${TD} border-b-0`}>Tests</td>
                    <td className={`${TD} border-b-0`}>pytest</td>
                    <td className={`${TD} border-b-0`}>
                      pytest points at a temp file, so the real <code>tasks.db</code> is left alone.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="api">
            <h2 className={H2}>API reference</h2>
            <p className="mt-3">
              JSON in, JSON out, except DELETE which has an empty body. Failures look like <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{`{"error": "..."}`}</code> with 400 (bad request) or 404 (missing task).
            </p>
            <div className={TABLE_WRAP}>
              <table className={TABLE}>
                <thead>
                  <tr>
                    <th className={TH}>Method</th>
                    <th className={TH}>Path</th>
                    <th className={TH}>What it does</th>
                    <th className={TH}>Success</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={TD}>GET</td>
                    <td className={TD}><code>/api/tasks</code></td>
                    <td className={TD}>List tasks. Query <code>?status=all</code>, <code>pending</code>, or <code>completed</code> (default <code>all</code>)</td>
                    <td className={TD}>200</td>
                  </tr>
                  <tr>
                    <td className={TD}>GET</td>
                    <td className={TD}><code>/api/tasks/&lt;id&gt;</code></td>
                    <td className={TD}>One task</td>
                    <td className={TD}>200</td>
                  </tr>
                  <tr>
                    <td className={TD}>POST</td>
                    <td className={TD}><code>/api/tasks</code></td>
                    <td className={TD}>Create a task</td>
                    <td className={TD}>201</td>
                  </tr>
                  <tr>
                    <td className={TD}>PUT</td>
                    <td className={TD}><code>/api/tasks/&lt;id&gt;</code></td>
                    <td className={TD}>Replace title, description, priority, due date. Leaves <code>completed</code> as it is.</td>
                    <td className={TD}>200</td>
                  </tr>
                  <tr>
                    <td className={TD}>PATCH</td>
                    <td className={TD}><code>/api/tasks/&lt;id&gt;</code></td>
                    <td className={TD}>Change only the fields you send, e.g. <code>{`{"completed": true}`}</code></td>
                    <td className={TD}>200</td>
                  </tr>
                  <tr>
                    <td className={`${TD} border-b-0`}>DELETE</td>
                    <td className={`${TD} border-b-0`}><code>/api/tasks/&lt;id&gt;</code></td>
                    <td className={`${TD} border-b-0`}>Remove it</td>
                    <td className={`${TD} border-b-0`}>204</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">
              Anything other than all / pending / completed for <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">status</code> is a 400.
            </p>
            <pre className={PRE}>
              <code>{`{"error": "status must be all, pending, or completed."}`}</code>
            </pre>
            <p className="mt-3 font-medium text-slate-900 dark:text-slate-100">Example: create a task</p>
            <pre className={PRE}>
              <code>{`curl -s -X POST http://127.0.0.1:5001/api/tasks \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Finish homework","description":"Chapter 4","priority":"high","due_date":"2026-10-01"}'`}</code>
            </pre>
            <p className="mt-3">Response (201):</p>
            <pre className={PRE}>
              <code>{`{
  "id": 1,
  "title": "Finish homework",
  "description": "Chapter 4",
  "priority": "high",
  "due_date": "2026-10-01",
  "completed": false,
  "created_at": "2026-09-28T09:00:00Z",
  "updated_at": "2026-09-28T09:00:00Z"
}`}</code>
            </pre>
          </section>

          <section id="database">
            <h2 className={H2}>Database</h2>
            <p className="mt-3">
              SQLite file <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">backend/tasks.db</code>, table <code>tasks</code>. The table also has CHECK constraints on priority and completed.
            </p>
            <div className={TABLE_WRAP}>
              <table className={TABLE}>
                <thead>
                  <tr>
                    <th className={TH}>Column</th>
                    <th className={TH}>Type</th>
                    <th className={TH}>Rules</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={TD}><code>id</code></td>
                    <td className={TD}>INTEGER</td>
                    <td className={TD}>Primary key, auto increment</td>
                  </tr>
                  <tr>
                    <td className={TD}><code>title</code></td>
                    <td className={TD}>TEXT</td>
                    <td className={TD}>Required (<code>NOT NULL</code>)</td>
                  </tr>
                  <tr>
                    <td className={TD}><code>description</code></td>
                    <td className={TD}>TEXT</td>
                    <td className={TD}>Required, default empty string</td>
                  </tr>
                  <tr>
                    <td className={TD}><code>priority</code></td>
                    <td className={TD}>TEXT</td>
                    <td className={TD}>
                      <code>NOT NULL</code>, default <code>medium</code>,{" "}
                      <code>CHECK (priority IN (&apos;low&apos;, &apos;medium&apos;, &apos;high&apos;))</code>
                    </td>
                  </tr>
                  <tr>
                    <td className={TD}><code>due_date</code></td>
                    <td className={TD}>TEXT</td>
                    <td className={TD}>Optional, <code>YYYY-MM-DD</code></td>
                  </tr>
                  <tr>
                    <td className={TD}><code>completed</code></td>
                    <td className={TD}>INTEGER</td>
                    <td className={TD}>
                      <code>NOT NULL</code>, default 0, <code>CHECK (completed IN (0, 1))</code>
                    </td>
                  </tr>
                  <tr>
                    <td className={TD}><code>created_at</code></td>
                    <td className={TD}>TEXT</td>
                    <td className={TD}>Required, UTC time</td>
                  </tr>
                  <tr>
                    <td className={`${TD} border-b-0`}><code>updated_at</code></td>
                    <td className={`${TD} border-b-0`}>TEXT</td>
                    <td className={`${TD} border-b-0`}>Required, UTC time</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="features">
            <h2 className={H2}>Features</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong className="text-slate-900 dark:text-slate-100">Optimistic updates with rollback.</strong> Ticking a task off or editing it updates the list first, then PATCH or PUT runs; if the API call fails, the previous rows and counts are restored and an error toast is shown.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-slate-100">Undo delete.</strong> The row disappears immediately; DELETE is sent after 5 seconds unless you press Undo. If the tab closes during that window, pending deletes still go out with <code>keepalive</code>.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-slate-100">URL-synced filter, search, and sort.</strong> <code>status</code>, <code>q</code>, and <code>sort</code> are written with <code>router.replace</code>, so a refresh or a shared link keeps the same view.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-slate-100">Keyboard shortcuts.</strong> N focuses the new-task title, / focuses search, 1 / 2 / 3 switch All / Pending / Completed, Esc cancels edit, closes the dialog, or clears search, and ? opens the shortcuts list.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-slate-100">Dark mode.</strong> <code>theme-init.js</code> sets the <code>dark</code> class on <code>&lt;html&gt;</code> from localStorage or the system preference before paint; the header switch saves the choice.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-slate-100">Priority-coloured cards.</strong> Cards stay on the list surface colour; a light wash and a left accent strip use CSS variables for low / medium / high in both light and dark themes.
              </li>
            </ul>
          </section>

          <section id="deployment">
            <h2 className={H2}>Deployment</h2>
            <p className="mt-3">
              The UI runs on Vercel and the API on PythonAnywhere.
            </p>
            <p className="mt-3">
              <strong className="text-slate-900 dark:text-slate-100">Vercel (frontend).</strong> Set the root directory to <code>frontend</code> and set <code>NEXT_PUBLIC_API_URL</code> to the PythonAnywhere URL, for example <code>https://yourusername.pythonanywhere.com</code>.
            </p>
            <p className="mt-3">
              <strong className="text-slate-900 dark:text-slate-100">PythonAnywhere (backend).</strong> Clone the repo, make a venv, <code>pip install -r requirements.txt</code>, then add a web app with manual configuration whose source folder is <code>backend/</code>. The WSGI file should import <code>app</code> from <code>app.py</code> (the host loads the module; it does not run <code>python app.py</code>). Set <code>FRONTEND_ORIGINS</code> to your Vercel URL (no trailing slash), for example <code>https://your-app.vercel.app</code>.
            </p>
            <p className="mt-3">
              SQLite works on PythonAnywhere because the account has a persistent disk, so <code>backend/tasks.db</code> stays between reloads.
            </p>
          </section>

          <section id="run-locally">
            <h2 className={H2}>Run locally</h2>
            <p className="mt-3">
              Use two terminals, both started from the project folder. Python 3.10+, Node.js 18.18+, npm, and Git are required. SQLite comes with Python.
            </p>
            <p className="mt-3 font-medium text-slate-900 dark:text-slate-100">1. API</p>
            <pre className={PRE}>
              <code>{`cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py`}</code>
            </pre>
            <p className="mt-3">
              That should print something about <code>http://127.0.0.1:5001</code>. The SQLite file is created on first start if it is not there yet. Port 5001 is used because on a Mac, port 5000 is often taken by AirPlay Receiver.
            </p>
            <p className="mt-3 font-medium text-slate-900 dark:text-slate-100">2. Frontend</p>
            <pre className={PRE}>
              <code>{`cd frontend
npm install
npm run dev`}</code>
            </pre>
            <p className="mt-3">
              Then open <code>http://localhost:3000</code>. If you need another API port, copy <code>frontend/.env.example</code> to <code>frontend/.env.local</code> and set <code>NEXT_PUBLIC_API_URL</code> to match.
            </p>
            <p className="mt-3">
              Full setup, Windows commands, and curl examples are in the{" "}
              <a
                className={LINK_CLASS}
                href="https://github.com/BEASTcLimbeR/task-management-app"
                target="_blank"
                rel="noopener noreferrer"
              >
                README on GitHub
              </a>
              .
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
