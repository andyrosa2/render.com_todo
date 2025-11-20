# Cloud Todo

Barebones todo app: Node.js, Express, PostgreSQL. One field (todo), one view (list), two buttons (add/delete), hardcoded login.

Login: `admin` / `admin123`

## Deploy to Render

1. Push to GitHub:
```bash
git add .
git commit -m "Deploy to Render"
git push origin main
```

2. Create Render account at [render.com](https://render.com) and connect your GitHub account

3. From Render dashboard:
   - Click **New +** → **Blueprint**
   - Select repository: `andyrosa2/antigravity-todo-test`
   - Click **Apply**

4. Render will:
   - Create a PostgreSQL database (`cloud-todo-db`)
   - Create a web service (`cloud-todo`)
   - Install dependencies (`npm install`)
   - Start the server (`node server.js`)
   - Generate `SESSION_SECRET` automatically

5. Once deployed, click the live URL to access the app

Login: `admin` / `admin123`

