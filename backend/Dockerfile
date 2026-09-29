FROM python:3.12-slim

WORKDIR /app

# Non-root user so the container does not run as root
RUN useradd --create-home --uid 1000 appuser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# SQLite file lives here; compose mounts a named volume over it
RUN mkdir -p /app/data && chown -R appuser:appuser /app

USER appuser

ENV TASKS_DB=/app/data/tasks.db

VOLUME /app/data

EXPOSE 5001

CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:5001", "app:app"]
