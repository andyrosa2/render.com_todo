# Cloud Todo

A barebones, Google Account password-protected todo application using Node.js, Express, and PostgreSQL.

## Features
- **Google Authentication**: Secure login with your Google account.
- **PostgreSQL Database**: Persistent storage for your todos.
- **Barebones & Fast**: Minimalist design and implementation.
- **Single Field**: Just "todo".
- **Delete to Complete**: Simple workflow.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env` file in the root directory with the following:
    ```env
    PORT=3000
    DATABASE_URL=postgresql://user:password@localhost:5432/cloud_todo
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    SESSION_SECRET=your_session_secret
    ```

3.  **Database Setup**:
    Ensure you have a PostgreSQL database running. The application will automatically create the table if it doesn't exist (via `schema.sql` manual run or just ensuring the table exists - *Note: You need to run the schema manually or add a setup script if you want auto-creation, but for barebones, just run the SQL*).
    
    To set up the database schema:
    ```bash
    psql $DATABASE_URL -f schema.sql
    ```

4.  **Run**:
    ```bash
    node server.js
    ```

5.  **Open**:
    Visit `http://localhost:3000`.

## Deployment (Render.com)

The easiest way to deploy this app is using **Render**.

1.  **Push to GitHub**:
    Create a new repository on GitHub and push your code:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/cloud-todo.git
    git branch -M main
    git push -u origin main
    ```

2.  **Deploy on Render**:
    *   Sign up/Log in to [Render.com](https://render.com).
    *   Click **"New +"** and select **"Blueprint"**.
    *   Connect your GitHub account and select the `cloud-todo` repository.
    *   Render will automatically detect the `render.yaml` file.
    *   Click **"Apply"**.

3.  **Configure Secrets**:
    *   Once the service is created, go to your **Dashboard**.
    *   Select the `cloud-todo` service.
    *   Go to **"Environment"**.
    *   You need to manually add your Google OAuth credentials:
        *   `GOOGLE_CLIENT_ID`: Your Google Client ID.
        *   `GOOGLE_CLIENT_SECRET`: Your Google Client Secret.
    *   *Note: The `DATABASE_URL` and `SESSION_SECRET` are handled automatically by the Blueprint.*

4.  **Google Cloud Console**:
    *   Don't forget to update your Google Cloud Console "Authorized redirect URIs" to include your new Render URL:
        *   `https://your-app-name.onrender.com/auth/google/callback`

