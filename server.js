// Сервер із заняття: Node.js + Express + SQLite
const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();
const db = new Database(path.join(__dirname, "tasks.db"));
const PORT = 3000;

app.use(express.json());
// Фронтенд і API працюють на одному порту, тому CORS тут не потрібний.
app.use(express.static(path.join(__dirname, "public")));

// Дані в таблиці не стираються після перезапуску
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0
  )
`);

// GET — усі завдання
app.get("/api/tasks", (req, res) => {
  const tasks = db.prepare("SELECT * FROM tasks ORDER BY id").all();
  res.json(tasks);
});

// GET — одне завдання
app.get("/api/tasks/:id", (req, res) => {
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
  if (!task) return res.status(404).json({ error: "Not Found" });
  res.json(task);
});

// POST — нове завдання
app.post("/api/tasks", (req, res) => {
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  if (!title) return res.status(400).json({ error: "Please, enter title" });

  const info = db.prepare("INSERT INTO tasks (title) VALUES (?)").run(title);
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(task);
});

// PUT — змінити назву та/або стан
app.put("/api/tasks/:id", (req, res) => {
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
  if (!task) return res.status(404).json({ error: "Not Found" });

  const title = req.body.title !== undefined ? String(req.body.title).trim() : task.title;
  const done = req.body.done !== undefined ? (req.body.done ? 1 : 0) : task.done;
  if (!title) return res.status(400).json({ error: "Title cannot be empty" });

  db.prepare("UPDATE tasks SET title = ?, done = ? WHERE id = ?").run(title, done, req.params.id);
  res.json(db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id));
});

// DELETE — видалити завдання
app.delete("/api/tasks/:id", (req, res) => {
  const info = db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "Not Found" });
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Server is working: http://localhost:${PORT}`);
});
