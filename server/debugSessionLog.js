const fs = require("fs");
const path = require("path");

/** Repo-root NDJSON log for debug session 978955 (Cursor ingest may not write to disk). */
const LOG_PATH = path.join(__dirname, "..", "debug-978955.log");

function appendDebugSessionLine(payload) {
  try {
    const line = JSON.stringify({ ...payload, timestamp: Date.now() }) + "\n";
    fs.appendFileSync(LOG_PATH, line, { encoding: "utf8" });
  } catch {
    /* ignore */
  }
}

module.exports = { appendDebugSessionLine, LOG_PATH };
