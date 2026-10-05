# StudentSpend deployment notes

## Architecture
- Frontend: static HTML/CSS/JavaScript on Render Static Site
- Backend: Node.js + Express on Render Web Service
- Database: MySQL-compatible TiDB Cloud
- Authentication: JWT + bcrypt

## Production API
The current frontend is configured to use:
`https://studentspend-api-qn7e.onrender.com`

If the backend URL changes, update the API base URL in:
- `frontend/js/data.js`
- `frontend/js/auth.js`

## Render frontend
- Service type: **Static Site**
- Repository: `Nima136/studentspend`
- Branch: `main`
- Root Directory: `frontend`
- Build Command: leave empty
- Publish Directory: `.`

## Render backend
- Service type: **Web Service**
- Repository: `Nima136/studentspend`
- Branch: `main`
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Instance type: **Free**

### Backend environment variables
Set these in Render; do not put real values in GitHub:
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME=studentspend`
- `DB_PORT=4000`
- `JWT_SECRET` — use a long random value (32+ characters)
- `FRONTEND_ORIGIN` — your exact Render frontend URL, e.g. `https://studentspend-yourname.onrender.com`
- `DEBUG_DB=false`

`/debug-db` is disabled unless `DEBUG_DB=true`, so production does not expose database metadata.

## Database
The backend expects the schema in `backend/schema.sql`.
For TiDB Cloud Starter use port `4000`; `backend/db.js` enables TLS 1.2+.

## Important security rules
- Never commit `.env`, database passwords, or `JWT_SECRET`.
- The included `.gitignore` excludes environment files and dependencies.
- Keep `FRONTEND_ORIGIN` restricted to your deployed frontend once its URL is known.
