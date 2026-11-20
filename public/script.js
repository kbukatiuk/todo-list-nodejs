// Практична №5. Той самий To-Do із практичної №4, але власний API.
const API_URL = "/api/tasks";

// Отримуємо HTML-елементи
const taskInput = document.getElementById("taskInput");
const addTaskButton = document.getElementById("addTaskButton");
const taskList = document.getElementById("taskList");
const taskCounter = document.getElementById("taskCounter");
const clearCompletedButton = document.getElementById("clearCompletedButton");
const filterButtons = document.querySelectorAll(".filter-button");
const progressPercent = document.getElementById("progressPercent");
const progressFill = document.getElementById("progressFill");
const errorMessage = document.getElementById("errorMessage");
const loadingMessage = document.getElementById("loadingMessage");

let tasks = [];
let currentFilter = "all";

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
}
function clearError() {
  errorMessage.textContent = "";
  errorMessage.style.display = "none";
}

// GET — отримуємо всі завдання із SQLite через наш сервер
async function loadTasks() {
  loadingMessage.style.display = "block";
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Не вдалося завантажити завдання");
    tasks = await response.json();
    clearError();
    renderTasks();
  } catch (error) {
    showError(error.message);
  } finally {
    loadingMessage.style.display = "none";
  }
}

// POST — додаємо нове завдання
async function addTask() {
  const taskText = taskInput.value.trim();
  if (!taskText) return;
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: taskText })
    });
    if (!response.ok) throw new Error("Не вдалося додати завдання");
    taskInput.value = "";
    await loadTasks();
    taskInput.focus();
  } catch (error) { showError(error.message); }
}

// PUT — змінюємо стан завдання (0 — активне, 1 — виконане)
async function toggleTask(id) {
  const task = tasks.find((task) => task.id === id);
  if (!task) return;
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !task.done })
    });
    if (!response.ok) throw new Error("Не вдалося змінити завдання");
    await loadTasks();
  } catch (error) { showError(error.message); }
}

// DELETE — видаляємо завдання
async function deleteTask(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Не вдалося видалити завдання");
    await loadTasks();
  } catch (error) { showError(error.message); }
}

// Оновлюємо лічильник і смугу прогресу
function updateCounter() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.done).length;
  const percent = total ? Math.round(completed / total * 100) : 0;
  taskCounter.textContent = `Усього: ${total} | Не виконано: ${total - completed}`;
  progressPercent.textContent = `${percent}%`;
  progressFill.style.width = `${percent}%`;
}

// Малюємо список, зберігаючи фільтри з минулої практичної
function renderTasks() {
  taskList.innerHTML = "";
  const filteredTasks = tasks.filter((task) => {
    if (currentFilter === "active") return !task.done;
    if (currentFilter === "completed") return !!task.done;
    return true;
  });

  if (filteredTasks.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-message";
    empty.textContent = "Тут поки немає завдань";
    taskList.appendChild(empty);
  }

  filteredTasks.forEach((task) => {
    const listItem = document.createElement("li");
    listItem.className = "task-item";
    if (task.done) listItem.classList.add("completed");

    const taskText = document.createElement("span");
    taskText.className = "task-text";
    taskText.textContent = task.title;

    const completeButton = document.createElement("button");
    completeButton.className = "complete-button";
    completeButton.textContent = task.done ? "Скасувати" : "Виконано";
    completeButton.addEventListener("click", () => toggleTask(task.id));

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Видалити";
    deleteButton.addEventListener("click", () => deleteTask(task.id));

    listItem.append(taskText, completeButton, deleteButton);
    taskList.appendChild(listItem);
  });
  updateCounter();
}

// Додаємо через кнопку та Enter
addTaskButton.addEventListener("click", addTask);
taskInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") addTask();
});

// Фільтри
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    currentFilter = button.dataset.filter;
    renderTasks();
  });
});

// Очищаємо всі виконані завдання
clearCompletedButton.addEventListener("click", async () => {
  const completedTasks = tasks.filter((task) => task.done);
  try {
    for (const task of completedTasks) {
      const response = await fetch(`${API_URL}/${task.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Не вдалося видалити всі виконані завдання");
    }
    await loadTasks();
  } catch (error) {
    showError(error.message);
    await loadTasks();
  }
});

loadTasks();
