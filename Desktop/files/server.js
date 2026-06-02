// ─────────────────────────────────────────────────────────────────────────────
//  URSC Store DBMS — Backend Server
//  Node.js + Express + CSV storage + Weekly auto-backup
//  Run: node server.js
// ─────────────────────────────────────────────────────────────────────────────

const express    = require("express");
const cors       = require("cors");
const fs         = require("fs");
const path       = require("path");
const csv        = require("csv-parser");
const cron       = require("node-cron");

const app  = express();
const PORT = 4000;

// ─── Data Directory ──────────────────────────────────────────────────────────
const DATA_DIR    = path.join(__dirname, "ursc-store-data");
const BACKUP_DIR  = path.join(DATA_DIR, "backups");
const LOG_FILE    = path.join(DATA_DIR, "backup.log");
const MAX_BACKUPS = 8;  // keep 8 weekly snapshots (~2 months)

const FILES = {
  categories : path.join(DATA_DIR, "categories.csv"),
  items      : path.join(DATA_DIR, "items.csv"),
  entries    : path.join(DATA_DIR, "entries.csv"),
  issues     : path.join(DATA_DIR, "issues.csv"),
};

const HEADERS = {
  categories : "id,name,createdAt\n",
  items      : "id,categoryId,name,currentStock,lastEntryDate\n",
  entries    : "id,itemId,categoryId,indentingOfficer,date,qtyReceived,openingQty,closingQty\n",
  issues     : "id,itemId,categoryId,requestedBy,approvedBy,date,qtyIssued,openingQty,closingQty\n",
};

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Bootstrap: create dirs and files ────────────────────────────────────────
function ensureDir(dir) {
  if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); console.log(`[INIT] Created directory: ${dir}`); }
}

function ensureFile(filepath, header) {
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, header, "utf8");
    console.log(`[INIT] Created file: ${path.basename(filepath)}`);
  }
}

function bootstrap() {
  ensureDir(DATA_DIR);
  ensureDir(BACKUP_DIR);
  Object.entries(FILES).forEach(([key, fp]) => ensureFile(fp, HEADERS[key]));
  ensureFile(LOG_FILE, "");
}

// ─── CSV Helpers ─────────────────────────────────────────────────────────────
function readCSV(filepath) {
  return new Promise((resolve, reject) => {
    const results = [];
    if (!fs.existsSync(filepath)) return resolve(results);
    fs.createReadStream(filepath)
      .pipe(csv())
      .on("data", row => results.push(row))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

// Atomic write: write to .tmp then rename so a crash never corrupts the file
function appendRow(filepath, row, header) {
  const tmpPath = filepath + ".tmp";
  let existing = "";
  try { existing = fs.readFileSync(filepath, "utf8"); } catch { existing = header; }
  if (!existing.trim()) existing = header.trimEnd();

  // Escape commas in string fields
  const line = Object.values(row).map(v => {
    const s = String(v ?? "");
    return s.includes(",") ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",");

  fs.writeFileSync(tmpPath, existing.trimEnd() + "\n" + line + "\n", "utf8");
  fs.renameSync(tmpPath, filepath);
}

// Overwrite entire file (for stock updates)
function writeCSV(filepath, header, rows) {
  const tmpPath = filepath + ".tmp";
  const keys = header.trim().split(",");
  const content = header + rows.map(r => keys.map(k => {
    const v = String(r[k] ?? "");
    return v.includes(",") ? `"${v.replace(/"/g, '""')}"` : v;
  }).join(",")).join("\n") + "\n";
  fs.writeFileSync(tmpPath, content, "utf8");
  fs.renameSync(tmpPath, filepath);
}

// ─── Backup Logic ─────────────────────────────────────────────────────────────
function logBackup(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, line, "utf8");
  console.log(line.trim());
}

async function runBackup(triggeredBy = "scheduler") {
  const dateStr = new Date().toISOString().slice(0, 10);
  const backupPath = path.join(BACKUP_DIR, `backup_${dateStr}`);
  ensureDir(backupPath);

  Object.entries(FILES).forEach(([, src]) => {
    const dest = path.join(backupPath, path.basename(src));
    if (fs.existsSync(src)) fs.copyFileSync(src, dest);
  });
  logBackup(`Backup completed → ${backupPath} (triggered by: ${triggeredBy})`);

  // Prune old backups — keep only MAX_BACKUPS most recent
  const allBackups = fs.readdirSync(BACKUP_DIR)
    .filter(d => d.startsWith("backup_"))
    .map(d => ({ name: d, full: path.join(BACKUP_DIR, d) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (allBackups.length > MAX_BACKUPS) {
    const toDelete = allBackups.slice(0, allBackups.length - MAX_BACKUPS);
    toDelete.forEach(b => {
      fs.rmSync(b.full, { recursive: true, force: true });
      logBackup(`Pruned old backup: ${b.name}`);
    });
  }
}

// Auto-restore if primary files are missing/empty
function autoRestore() {
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(d => d.startsWith("backup_"))
    .sort()
    .reverse();

  if (backups.length === 0) return;

  const latest = path.join(BACKUP_DIR, backups[0]);
  let restored = false;

  Object.entries(FILES).forEach(([key, dest]) => {
    const src = path.join(latest, path.basename(dest));
    const isEmpty = !fs.existsSync(dest) || fs.readFileSync(dest, "utf8").trim() === HEADERS[key].trim();
    if (isEmpty && fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.warn(`[RESTORE] Restored ${path.basename(dest)} from ${backups[0]}`);
      restored = true;
    }
  });
  if (restored) logBackup(`Auto-restore from ${backups[0]} completed`);
}

// ─── Schedule Weekly Backup (every Sunday midnight) ──────────────────────────
cron.schedule("0 0 * * 0", () => { runBackup("weekly-cron"); });

// ─── Routes ──────────────────────────────────────────────────────────────────

// --- Categories ---
app.get("/api/categories", async (req, res) => {
  try { res.json(await readCSV(FILES.categories)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/categories", (req, res) => {
  try {
    const { id, name } = req.body;
    if (!id || !name) return res.status(400).json({ error: "id and name required" });
    appendRow(FILES.categories, { id, name, createdAt: new Date().toISOString().slice(0, 10) }, HEADERS.categories);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Items ---
app.get("/api/items", async (req, res) => {
  try { res.json(await readCSV(FILES.items)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/items", (req, res) => {
  try {
    const { id, categoryId, name, currentStock, lastEntryDate } = req.body;
    if (!id || !name) return res.status(400).json({ error: "id and name required" });
    appendRow(FILES.items, { id, categoryId, name, currentStock: currentStock ?? 0, lastEntryDate: lastEntryDate ?? "" }, HEADERS.items);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update item stock (called after entry/issue)
app.patch("/api/items/:id", async (req, res) => {
  try {
    const rows = await readCSV(FILES.items);
    const idx = rows.findIndex(r => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Item not found" });
    rows[idx] = { ...rows[idx], ...req.body };
    writeCSV(FILES.items, HEADERS.items, rows);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Entries ---
app.get("/api/entries", async (req, res) => {
  try { res.json(await readCSV(FILES.entries)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/entries", async (req, res) => {
  try {
    const entry = req.body;
    if (!entry.id || !entry.itemId) return res.status(400).json({ error: "id and itemId required" });

    // Update item stock
    const items = await readCSV(FILES.items);
    const idx = items.findIndex(it => it.id === entry.itemId);
    if (idx !== -1) {
      items[idx].currentStock = entry.closingQty;
      items[idx].lastEntryDate = entry.date;
      writeCSV(FILES.items, HEADERS.items, items);
    }

    appendRow(FILES.entries, entry, HEADERS.entries);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Issues ---
app.get("/api/issues", async (req, res) => {
  try { res.json(await readCSV(FILES.issues)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/issues", async (req, res) => {
  try {
    const issue = req.body;
    if (!issue.id || !issue.itemId) return res.status(400).json({ error: "id and itemId required" });

    // Update item stock
    const items = await readCSV(FILES.items);
    const idx = items.findIndex(it => it.id === issue.itemId);
    if (idx !== -1) {
      items[idx].currentStock = issue.closingQty;
      writeCSV(FILES.items, HEADERS.items, items);
    }

    appendRow(FILES.issues, issue, HEADERS.issues);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Manual Backup ---
app.post("/api/backup", async (req, res) => {
  try {
    await runBackup("manual-api");
    res.json({ ok: true, message: "Backup completed successfully." });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Health Check ---
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    dataDir: DATA_DIR,
    files: Object.fromEntries(Object.entries(FILES).map(([k, v]) => [k, fs.existsSync(v)])),
    timestamp: new Date().toISOString()
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
bootstrap();
autoRestore();

app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════╗`);
  console.log(`║  URSC Store DBMS — Backend                  ║`);
  console.log(`║  Running on http://localhost:${PORT}            ║`);
  console.log(`║  Data directory: ${DATA_DIR}  ║`);
  console.log(`╚══════════════════════════════════════════════╝\n`);

  // Log next backup time
  const now = new Date();
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + (7 - now.getDay()) % 7 || 7);
  nextSunday.setHours(0, 0, 0, 0);
  console.log(`[BACKUP] Next scheduled backup: ${nextSunday.toDateString()} at midnight`);
  console.log(`[BACKUP] Keeping last ${MAX_BACKUPS} weekly backups (~2 months)\n`);
});
