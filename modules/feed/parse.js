import crypto from "crypto";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text"
});

function arr(x) {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

function text(x) {
  if (!x) return "";
  if (typeof x === "string") return x;
  if (typeof x === "number") return String(x);
  if (typeof x === "object" && x["#text"]) return String(x["#text"]);
  return "";
}

function pickLink(linkNode) {
  // RSS: <link>https://...</link>
  // Atom: <link href="..."/>
  if (!linkNode) return "";
  if (typeof linkNode === "string") return linkNode;
  if (Array.isArray(linkNode)) {
    // Prefer rel="alternate"
    const alt = linkNode.find(l => l?.["@_rel"] === "alternate") || linkNode[0];
    return alt?.["@_href"] || text(alt) || "";
  }
  return linkNode?.["@_href"] || text(linkNode) || "";
}

function toIsoDate(d) {
  if (!d) return null;
  const s = text(d);
  const ms = Date.parse(s);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

function makeItemId(feedId, guid, link, title, date) {
  const key = `${feedId}::${guid || ""}::${link || ""}::${title || ""}::${date || ""}`;
  return crypto.createHash("sha1").update(key).digest("hex").slice(0, 12);
}

export function parseFeedXml(feedId, xml) {
  const doc = parser.parse(xml);

  // RSS
  if (doc?.rss?.channel) {
    const ch = doc.rss.channel;
    const items = arr(ch.item).map((it) => {
      const title = text(it.title).trim();
      const link = text(it.link).trim();
      const guid = text(it.guid).trim();
      const date = toIsoDate(it.pubDate) || toIsoDate(it["dc:date"]) || null;
      const id = makeItemId(feedId, guid, link, title, date);

      return {
        id,
        feed: feedId,
        title: title || "(untitled)",
        link,
        guid: guid || null,
        date,
        read: false
      };
    });

    return items.filter(i => i.link || i.guid || i.title);
  }

  // Atom
  if (doc?.feed?.entry) {
    const entries = arr(doc.feed.entry).map((e) => {
      const title = text(e.title).trim();
      const link = pickLink(e.link).trim();
      const guid = text(e.id).trim(); // Atom id is typically unique
      const date = toIsoDate(e.updated) || toIsoDate(e.published) || null;
      const id = makeItemId(feedId, guid, link, title, date);

      return {
        id,
        feed: feedId,
        title: title || "(untitled)",
        link,
        guid: guid || null,
        date,
        read: false
      };
    });

    return entries.filter(i => i.link || i.guid || i.title);
  }

  return [];
}
