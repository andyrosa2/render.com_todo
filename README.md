Barebones notes app deployed to Render
Node.js, Express, PostgreSQL.
No css.
It allows you to add a new note to a list of notes.


Origin:
	This was a test for Lee as where to host stuff.
- Gemini: [IT-80804 - cloud hosts](http://gemini.digitalforces.com/Gemini/issue/ViewIssue.aspx?id=80804&PROJID=2)
- Spreadsheet: [Cloud Hosts spreadsheet](https://docs.google.com/spreadsheets/d/1FioWo5rhkhB_Fcc-FQ7ZKjIHSIQVFgm1JHfnBwNFb6w/edit?gid=1847581680#gid=1847581680)
- GitHub: https://github.com/andyrosa2/render.com_todo

Render Glossary:
Workspace: Your top-level Render container for resources, members, billing, and settings. Can be hobby, pro,org,enterprise.
Blueprint: Infrastructure-as-code for Render; a render.yaml file that declares desired resources and configuration. Points to github repo and branch to deploy from. Applying the Blueprint creates/updates resources to match the declaration.
Project: A logical container that groups one or more environments (often prod/staging/dev). Free can only have one project.
Environment: A named grouping inside a project that contains specific resources that belong together.
Resource: Any managed thing in Render (service, database, key value, env var group, etc.).
Service: A runnable app component Render builds and runs (web service, static site, worker, cron, private service).
Web service: A public HTTP service (gets an onrender.com URL and can have custom domains).
Static site: A CDN-hosted site that serves built static files; not a long-running server process.
Datastore: A managed data service (e.g., Render Postgres, Render Key Value).
Postgres instance: A managed PostgreSQL service on Render; it contains a database name, user, password, host, and port.
Apply (Blueprint): The action that creates/updates resources to match what render.yaml declares.
Sync (Blueprint): Render’s ongoing process of reconciling real resources with the Blueprint definition.
Environment variable: A key/value pair provided to a service at runtime (e.g., DATABASE_URL).
fromDatabase connectionString: A Blueprint reference that sets an env var from a Postgres instance’s private-network connection URL.
Region: The physical/geo location where a resource runs; private hostnames typically resolve only within the same region.
Plan / instance type: The size/price tier of a service or datastore (free, starter, etc.).

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

Dashboard grouping note (how this is set up right now):
- The frontend/web app service shows up inside a Project/Environment.
- The Postgres database (and a Key Value instance) show up under Ungrouped Services (not inside the Project).
- This is just organizational in the dashboard: the resources still exist and can still be linked via env vars; being ungrouped does not by itself prevent connections.
- If you want everything grouped together, that requires explicitly assigning the datastores to the Project/Environment (either via the dashboard UI if available, or by defining projects/environments in render.yaml and re-applying the Blueprint).

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

- **Sync Error: "id is empty id is empty"** after renaming the GitHub repo:
	- This happens because the Blueprint loses its internal mapping between the YAML definition and the actual provisioned resources when the repo identity changes.
	- Render Blueprints are tied to a specific repo URL; renaming the repo can break that link.
	- Fixes (try in order):
		1. Go to the Blueprint's **Settings** in the Render dashboard and update the connected repository to the new repo name/URL.
		2. If that doesn't work, delete the old Blueprint instance, then create a new Blueprint pointing to the renamed repo and **Apply** it. (You may need to delete existing services/databases first to avoid name conflicts.)
	- After re-creating via Blueprint, verify that `DATABASE_URL` is correctly wired to the new Postgres instance.

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

From [dashboard](https://dashboard.render.com/):
- Click **New +** → **Blueprint**
- Select repository: `andyrosa2/render.com_todo`
- Click **Apply**

Launch:
https://cloud-todo-i6a7.onrender.com

**Important Conclusion: Render is unfriendly.**
Render's developer experience is poor. Simple operations like renaming a repo break Blueprints with cryptic errors ("id is empty"). The dashboard organization is confusing (resources end up ungrouped for no obvious reason). Troubleshooting requires guesswork — error messages are unhelpful.
