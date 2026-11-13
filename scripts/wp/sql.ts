/**
 * Minimal MySQL dump reader: pulls the rows of selected tables out of
 * `INSERT INTO ... VALUES (...),(...);` statements (mysqldump / phpMyAdmin).
 */
type Row = Record<string, string | null>;

const WP_COLUMNS: Record<string, string[]> = {
  posts: [
    "ID", "post_author", "post_date", "post_date_gmt", "post_content", "post_title", "post_excerpt",
    "post_status", "comment_status", "ping_status", "post_password", "post_name", "to_ping", "pinged",
    "post_modified", "post_modified_gmt", "post_content_filtered", "post_parent", "guid", "menu_order",
    "post_type", "post_mime_type", "comment_count",
  ],
  postmeta: ["meta_id", "post_id", "meta_key", "meta_value"],
  terms: ["term_id", "name", "slug", "term_group"],
  term_taxonomy: ["term_taxonomy_id", "term_id", "taxonomy", "description", "parent", "count"],
  term_relationships: ["object_id", "term_taxonomy_id", "term_order"],
  users: [
    "ID", "user_login", "user_pass", "user_nicename", "user_email", "user_url", "user_registered",
    "user_activation_key", "user_status", "display_name",
  ],
};

function parseValues(s: string, start: number): { rows: (string | null)[][]; end: number } {
  const rows: (string | null)[][] = [];
  let i = start;
  const n = s.length;
  while (i < n) {
    while (i < n && /[\s,]/.test(s[i])) i++;
    if (i >= n || s[i] === ";") return { rows, end: i + 1 };
    if (s[i] !== "(") throw new Error(`Unexpected '${s[i]}' at offset ${i}`);
    i++;
    const row: (string | null)[] = [];
    for (;;) {
      while (/\s/.test(s[i])) i++;
      if (s[i] === "'") {
        i++;
        let out = "";
        for (;;) {
          const c = s[i];
          if (c === undefined) throw new Error("Unterminated string in dump");
          if (c === "\\") {
            const e = s[i + 1];
            out += e === "n" ? "\n" : e === "r" ? "\r" : e === "t" ? "\t" : e === "0" ? "\0" : e === "Z" ? "\x1a" : e;
            i += 2;
          } else if (c === "'" && s[i + 1] === "'") {
            out += "'";
            i += 2;
          } else if (c === "'") {
            i++;
            break;
          } else {
            out += c;
            i++;
          }
        }
        row.push(out);
      } else {
        let j = i;
        while (j < n && s[j] !== "," && s[j] !== ")") j++;
        const raw = s.slice(i, j).trim();
        row.push(raw.toUpperCase() === "NULL" ? null : raw);
        i = j;
      }
      while (/\s/.test(s[i])) i++;
      if (s[i] === ",") {
        i++;
        continue;
      }
      if (s[i] === ")") {
        i++;
        break;
      }
      throw new Error(`Bad row syntax at offset ${i}`);
    }
    rows.push(row);
  }
  return { rows, end: i };
}

/** Returns rows for each WordPress table (keyed without prefix) found in the dump. */
export function readWpTables(dump: string, prefix: string) {
  const result: Record<string, Row[]> = {};
  const re = /INSERT\s+(?:IGNORE\s+)?INTO\s+`?([\w$]+)`?\s*(\(([^)]*)\))?\s*VALUES\s*/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(dump))) {
    const table = m[1];
    if (!table.startsWith(prefix)) continue;
    const key = table.slice(prefix.length);
    if (!(key in WP_COLUMNS)) continue;
    const cols = m[3] ? m[3].split(",").map((c) => c.trim().replace(/`/g, "")) : WP_COLUMNS[key];
    const { rows, end } = parseValues(dump, re.lastIndex);
    re.lastIndex = end;
    (result[key] ??= []).push(...rows.map((r) => Object.fromEntries(cols.map((c, idx) => [c, r[idx] ?? null]))));
  }
  return result;
}

/** Guess the table prefix from the dump (e.g. "64_"). */
export function detectPrefix(dump: string) {
  const m = /INSERT\s+(?:IGNORE\s+)?INTO\s+`?([\w$]*?)posts`?[\s(]/i.exec(dump);
  return m ? m[1] : "wp_";
}
