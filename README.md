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

## Deployment
Ready for deployment to cloud providers like Render, Railway, or Heroku. Just set the environment variables in your dashboard.
