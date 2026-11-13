import sanitizeHtml from "sanitize-html";

const SITE_ORIGINS = [
  "https://golfpersonalities.com",
  "http://golfpersonalities.com",
  "https://www.golfpersonalities.com",
  "http://www.golfpersonalities.com",
];

/** Strip old absolute site URLs so images and links resolve on the new site. */
export function relativizeSiteUrls(html: string) {
  let out = html;
  for (const origin of SITE_ORIGINS) out = out.split(origin).join("");
  return out;
}

/**
 * Sanitizes post HTML. Imported WordPress content came from a compromised
 * site, so scripts, iframes from unknown hosts, event handlers and inline
 * styles are all removed.
 */
export function sanitizePostHtml(html: string) {
  return sanitizeHtml(relativizeSiteUrls(html), {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      "img",
      "figure",
      "figcaption",
      "iframe",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
    ],
    allowedAttributes: {
      a: ["href", "name", "target", "rel", "title"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      iframe: ["src", "width", "height", "allow", "allowfullscreen", "title"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedIframeHostnames: ["www.youtube.com", "www.youtube-nocookie.com", "player.vimeo.com"],
    transformTags: {
      a: (tagName, attribs) => {
        const external = /^https?:\/\//.test(attribs.href ?? "");
        return {
          tagName,
          attribs: external ? { ...attribs, rel: "nofollow noopener noreferrer", target: "_blank" } : attribs,
        };
      },
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: "lazy" } }),
    },
  });
}

export function stripHtml(html: string) {
  return sanitizeHtml(html.replace(/<\/?(p|h[1-6]|li|br|div|figcaption|td|th)[^>]*>/gi, " "), { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();
}

export function makeExcerpt(html: string, words = 32) {
  const text = stripHtml(html).split(" ");
  return text.length <= words ? text.join(" ") : text.slice(0, words).join(" ") + "…";
}
