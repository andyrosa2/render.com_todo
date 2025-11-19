const app = document.getElementById('app');
const loginPrompt = document.getElementById('login-prompt');
const authSection = document.getElementById('auth-section');
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');

async function checkAuth() {
    try {
        const res = await fetch('/me');
        if (res.ok) {
            const data = await res.json();
            showApp(data.user);
        } else {
            showLogin();
        }
    } catch (err) {
        console.error('Auth check failed', err);
        showLogin();
    }
}

function showLogin() {
    app.style.display = 'none';
    loginPrompt.style.display = 'block';
    authSection.innerHTML = '';
}

function showApp(user) {
    app.style.display = 'block';
    loginPrompt.style.display = 'none';
    authSection.innerHTML = `
        <div class="user-info">
            <span>Hello, ${user.displayName || 'User'}</span>
            <a href="/logout" class="logout-btn">Logout</a>
        </div>
    `;
    loadTodos();
}

async function loadTodos() {
    const res = await fetch('/todos');
    if (res.ok) {
        const todos = await res.json();
        renderTodos(todos);
    }
}

function renderTodos(todos) {
    todoList.innerHTML = todos.map(todo => `
        <li class="todo-item">
            <span class="todo-text">${escapeHtml(todo.todo)}</span>
            <button class="delete-btn" onclick="deleteTodo(${todo.id})">&times;</button>
        </li>
    `).join('');
}

async function deleteTodo(id) {
    await fetch(`/todos/${id}`, { method: 'DELETE' });
    loadTodos();
}

todoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;

    await fetch('/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ todo: text })
    });

    todoInput.value = '';
    loadTodos();
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

checkAuth();
