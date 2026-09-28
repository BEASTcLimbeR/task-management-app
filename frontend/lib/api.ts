export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:5001";

export type Priority = "low" | "medium" | "high";
export type TaskStatus = "all" | "pending" | "completed";

export type Task = {
  id: number;
  title: string;
  description: string;
  priority: Priority;
  due_date: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export type TaskInput = {
  title: string;
  description?: string;
  priority?: Priority;
  due_date?: string | null;
};

// Thrown when the Flask API returns an error or cannot be reached
export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

// Tell the UI whether this error means Flask is not running
export function isUnreachableError(error: unknown): boolean {
  return (
    error instanceof Error && error.message.includes("Can't reach the API")
  );
}

// Send JSON to Flask and return the parsed body, or throw the server's error message
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      `Can't reach the API at ${API_URL} — is the Flask server running?`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json();
  if (!response.ok) {
    throw new ApiError(typeof body.error === "string" ? body.error : "Request failed");
  }
  return body as T;
}

// Load tasks from Flask, using ?status= so filtering happens on the server
export function listTasks(status: TaskStatus): Promise<Task[]> {
  return request<Task[]>(`/api/tasks?status=${encodeURIComponent(status)}`);
}

// Create a new task
export function createTask(data: TaskInput): Promise<Task> {
  return request<Task>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Replace a task's details with PUT (does not change completed)
export function updateTask(id: number, data: TaskInput): Promise<Task> {
  return request<Task>(`/api/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Mark a task complete or not complete with PATCH
export function setCompleted(id: number, completed: boolean): Promise<Task> {
  return request<Task>(`/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ completed }),
  });
}

// Delete a task; Flask returns 204 with no body
export function deleteTask(id: number): Promise<void> {
  return request<void>(`/api/tasks/${id}`, { method: "DELETE" });
}
