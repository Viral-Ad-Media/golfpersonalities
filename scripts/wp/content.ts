/** Helpers that turn raw WordPress post content into plain HTML. */

type El = { elType?: string; widgetType?: string; settings?: Record<string, unknown>; elements?: El[] };

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function walk(el: El, out: string[]) {
  const s = el.settings ?? {};
  switch (el.widgetType) {
    case "heading": {
      const tag = typeof s.header_size === "string" && /^h[1-6]$/.test(s.header_size) ? s.header_size : "h2";
      if (s.title) out.push(`<${tag}>${String(s.title)}</${tag}>`);
      break;
    }
    case "text-editor":
      if (s.editor) out.push(String(s.editor));
      break;
    case "image": {
      const img = s.image as { url?: string; alt?: string } | undefined;
      if (img?.url)
        out.push(
          `<figure><img src="${esc(img.url)}" alt="${esc(img.alt ?? "")}"/>${s.caption ? `<figcaption>${String(s.caption)}</figcaption>` : ""}</figure>`,
        );
      break;
    }
    case "video":
      if (typeof s.youtube_url === "string") {
        const id = /(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/.exec(s.youtube_url)?.[1];
        if (id) out.push(`<iframe src="https://www.youtube-nocookie.com/embed/${id}" title="Video" allowfullscreen></iframe>`);
      }
      break;
    case "icon-list": {
      const items = (s.icon_list as { text?: string }[] | undefined) ?? [];
      if (items.length) out.push(`<ul>${items.map((i) => `<li>${i.text ?? ""}</li>`).join("")}</ul>`);
      break;
    }
  }
  for (const child of el.elements ?? []) walk(child, out);
}

/** Rebuilds simple HTML from Elementor's `_elementor_data` JSON. */
export function elementorToHtml(json: string): string {
  try {
    const data = JSON.parse(json) as El[];
    const out: string[] = [];
    for (const el of data) walk(el, out);
    return out.join("\n");
  } catch {
    return "";
  }
}

/** Small port of WordPress wpautop plus block-comment and shortcode stripping. */
export function cleanWpContent(raw: string) {
  let html = raw
    .replace(/<!--\s*\/?wp:[\s\S]*?-->/g, "")
    .replace(/\[\/?[a-z_][\w-]*(?:\s[^\]]*)?\]/gi, "")
    .replace(/\r\n/g, "\n");
  if (!/<p[\s>]/i.test(html)) {
    const block = "h[1-6]|ul|ol|table|figure|blockquote|div|iframe|hr";
    html = html
      .replace(new RegExp(`(<(?:${block})[\\s>])`, "gi"), "\n\n$1")
      .replace(new RegExp(`(</(?:${block})>)`, "gi"), "$1\n\n")
      .split(/\n\s*\n/)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) =>
        /^<(h[1-6]|ul|ol|table|figure|blockquote|div|iframe|img|hr)/i.test(chunk)
          ? chunk
          : `<p>${chunk.replace(/\n/g, "<br />")}</p>`,
      )
      .join("\n");
  }
  return html;
}
