# URSC Store DBMS
### ISRO · U R Rao Satellite Centre · Bengaluru
**Internal Inventory Management System — v1.0**

---

## Project Structure

```
ursc-store/
├── App.jsx          ← React frontend (paste into Claude artifact or Vite project)
├── server.js        ← Node.js backend API
├── package.json     ← Backend dependencies
└── README.md
```

---

## Frontend Setup

### Option A — Claude Artifact (quickest)
1. Open a new Claude conversation
2. Paste the entire contents of `App.jsx` and say: *"Run this as a React artifact"*
3. The app will render immediately in-browser with full seed data

### Option B — Vite React Project (for full local dev)
```bash
npm create vite@latest ursc-frontend -- --template react
cd ursc-frontend
npm install recharts
# Replace src/App.jsx with the provided App.jsx
npm run dev
```

---

## Backend Setup

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# Server runs on http://localhost:4000
# Data stored in ./ursc-store-data/
```

### First run
On first start, the server automatically:
- Creates `/ursc-store-data/` directory
- Creates all 4 CSV files with headers: `categories.csv`, `items.csv`, `entries.csv`, `issues.csv`
- Creates `/ursc-store-data/backups/` for weekly snapshots
- Checks for any missing/empty files and auto-restores from the latest backup if found

---

## Data Storage

All data lives in plain CSV files on your local drive:

```
ursc-store-data/
├── categories.csv
├── items.csv
├── entries.csv
├── issues.csv
├── backup.log
└── backups/
    ├── backup_2026-05-25/
    │   ├── categories.csv
    │   ├── items.csv
    │   ├── entries.csv
    │   └── issues.csv
    └── backup_2026-06-01/   ← (next Sunday)
        └── ...
```

---

## Backup System

| Feature | Detail |
|---|---|
| Schedule | Every Sunday at midnight (automatic) |
| Retention | Last 8 backups (~2 months) |
| Auto-restore | If primary CSVs are missing on server start |
| Manual trigger | `POST http://localhost:4000/api/backup` |
| Log file | `ursc-store-data/backup.log` |

### To back up to a second physical drive (recommended)
In `server.js`, find the `runBackup()` function and add:
```js
const secondDrivePath = "D:\\ursc-store-backups\\backup_" + dateStr;  // Windows
// or: "/media/backup-drive/ursc-store/backup_" + dateStr;            // Linux
ensureDir(secondDrivePath);
Object.entries(FILES).forEach(([, src]) => {
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(secondDrivePath, path.basename(src)));
});
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/categories` | List all categories |
| POST | `/api/categories` | Add a new category |
| GET | `/api/items` | List all items |
| POST | `/api/items` | Add a new item |
| PATCH | `/api/items/:id` | Update item (stock etc.) |
| GET | `/api/entries` | List all entries |
| POST | `/api/entries` | Record a new entry (auto-updates stock) |
| GET | `/api/issues` | List all issues |
| POST | `/api/issues` | Record a new issue (auto-updates stock) |
| POST | `/api/backup` | Trigger manual backup |
| GET | `/api/health` | Server + file health check |

---

## Login Credentials (Demo)

| Field | Value |
|---|---|
| Employee ID | `URSC001` |
| Password | `isro@123` |

---

## Notes

- All write operations are **atomic** — data is written to a `.tmp` file then renamed, so a server crash never corrupts a CSV mid-write.
- The frontend works fully **offline** (in-memory) even without the backend running — it gracefully swallows backend errors.
- The AI Insight button in Reports calls the Anthropic API directly — ensure `ANTHROPIC_API_KEY` is configured in your environment if running server-side, or it works client-side via Claude artifact context.

---

*URSC Bangalore · Department of Space · Government of India*
*Store DBMS v1.0 — Internal Use Only*
