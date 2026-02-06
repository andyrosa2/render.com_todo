Barebones notes app deployed to Render
Node.js, Express, PostgreSQL.
No css.
It allows you to add a new note to a list of notes.

This was a test for Lee as where to host stuff.

Database:
- This app talks to Postgres through the `DATABASE_URL` environment variable.
- Locally, `start-local.ps1` points `DATABASE_URL` at a local Postgres database named `cloud_todo`.
- On Render, `render.yaml` defines a Render Postgres instance named `cloud-todo-db` and wires its `connectionString` into the web service’s `DATABASE_URL`.
	- “Provision” here means: when you apply the Blueprint, Render will create that database if it doesn’t exist yet, or reuse it if a Postgres instance with that exact name already exists in the workspace.
	- Render’s `connectionString` is a private-network address (intended to be reachable from Render services in the same region), not a public hostname.
	- Note: Free Render Postgres databases expire 30 days after creation (with a short grace period to upgrade before deletion).

Render Free tier behavior (FYI):
- Free web services spin down after ~15 minutes of no inbound traffic.
	- The next request has a noticeable cold-start delay (can take up to ~1 minute to boot).
- Free web services also have monthly Free instance-hour limits; if you use them up, Render suspends the service until the start of the next month.
- Render can also suspend Free services if you exceed included bandwidth without a payment method on file.

Troubleshooting (Render):
- `getaddrinfo ENOTFOUND dpg-...` at startup means Node can’t resolve the Postgres hostname in `DATABASE_URL`.
	- In this setup, that hostname is expected to be Render’s internal/private Postgres host. If it can’t be resolved, it’s usually not an “auth” problem — it’s “the host isn’t resolvable from where this code is running.”
	- Common causes:
		- The Postgres instance was deleted, expired (Free tier), or renamed, but the service still has an old `DATABASE_URL` value.
		- The web service and Postgres are in different regions (private hostnames only resolve within a region).
	- What to check in the dashboard (conceptually):
		- The Postgres resource exists in the workspace and is healthy (it should be listed as a Postgres datastore, with a region).
		- The web service’s Environment has `DATABASE_URL` set from the database (not a stale hardcoded value).
		- The service region and database region match.
	- Typical fix: recreate the DB (or let the Blueprint recreate it), then re-link `DATABASE_URL` to the correct database connection string.

Local Development:
Requires a local Postgres database named `cloud_todo` and a local `DATABASE_URL` like:
`postgresql://postgres:postgres@localhost:5432/cloud_todo`

Then:
1. `npm install`
2. Run `.\start-local.ps1`
3. Open http://localhost:3000

Cloud Deployment:
Push to github
Create Render account at [render.com](https://render.com) 
connect your GitHub account

From Render dashboard:
- Click **New +** → **Blueprint**
- Select repository: `andyrosa2/antigravity-todo-test`
- Click **Apply**

Launch:
https://cloud-todo-i6a7.onrender.com
