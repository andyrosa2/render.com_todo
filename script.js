const app = document.getElementById('app');
const setupPrompt = document.getElementById('setup-prompt');
const loginPrompt = document.getElementById('login-prompt');
const authSection = document.getElementById('auth-section');
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const setupForm = document.getElementById('setup-form');
const setupPasswordInput = document.getElementById('setup-password-input');
const setupError = document.getElementById('setup-error');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password-input');
const loginError = document.getElementById('login-error');

async function checkAuth() {
    try {
        const res = await fetch('/me');
        if (res.ok) {
            const data = await res.json();
            showApp(data.user);
        } else {
            const setupRes = await fetch('/setup-required');
            const setupData = await setupRes.json();
            if (setupData.setupRequired) {
                showSetup();
            } else {
                showLogin();
            }
        }
    } catch (err) {
        console.error('Auth check failed', err);
        showLogin();
    }
}

function showSetup() {
    app.style.display = 'none';
    setupPrompt.style.display = 'block';
    loginPrompt.style.display = 'none';
    authSection.innerHTML = '';
    if (setupError) setupError.style.display = 'none';
    if (setupPasswordInput) setupPasswordInput.value = '';
}

function showLogin() {
    app.style.display = 'none';
    setupPrompt.style.display = 'none';
    loginPrompt.style.display = 'block';
    authSection.innerHTML = '';
    if (loginError) loginError.style.display = 'none';
    if (passwordInput) passwordInput.value = '';
}

function showApp(user) {
    app.style.display = 'block';
    setupPrompt.style.display = 'none';
    loginPrompt.style.display = 'none';
    authSection.innerHTML = `
        <div class="user-info">
            <span>Logged in as ${user.displayName || 'Admin'}</span>
            <a href="/logout" class="logout-btn">Logout</a>
        </div>
    `;
    loadTodos();
}

if (setupForm) {
    setupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = setupPasswordInput.value;
        try {
            const res = await fetch('/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (res.ok) {
                const data = await res.json();
                showApp(data.user);
            } else {
                const err = await res.json();
                if (setupError) {
                    setupError.textContent = err.error || 'Setup failed';
                    setupError.style.display = 'block';
                }
            }
        } catch (err) {
            console.error('Setup error', err);
            if (setupError) {
                setupError.textContent = 'An error occurred';
                setupError.style.display = 'block';
            }
        }
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username-input').value;
        const password = passwordInput.value;
        try {
            const res = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (res.ok) {
                const data = await res.json();
                showApp(data.user);
            } else {
                const err = await res.json();
                if (loginError) {
                    loginError.textContent = err.error || 'Login failed';
                    loginError.style.display = 'block';
                }
            }
        } catch (err) {
            console.error('Login error', err);
            if (loginError) {
                loginError.textContent = 'An error occurred';
                loginError.style.display = 'block';
            }
        }
    });
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
