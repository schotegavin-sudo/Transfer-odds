/* A record in a link.
 *
 * The whole point of this tool is that nothing leaves your browser, so sharing
 * cannot mean uploading. Instead the record is packed into the URL itself: your
 * friend opens the link, sees exactly your setup, changes the GPA to theirs and
 * sends a new link back. No account, no server, nothing stored anywhere.
 *
 * Packed with deflate where the browser has it — school names repeat "University
 * of California, " and friends, so they compress to roughly a third — and plain
 * base64 where it does not.
 */

const VERSION = "1";

/* Short keys, because every byte shows up in the URL. */
const PACK = {
  gpa: "g", credits: "c", prereqs: "p", blemish: "b", current: "n", curtype: "t",
  state: "s", assoc: "a", agreement: "r", majorId: "m", term: "e", essay: "y",
  activity: "v", context: "x", list: "l",
};
const UNPACK = Object.fromEntries(Object.entries(PACK).map(([k, v]) => [v, k]));

const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64url = (s) => {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  return Uint8Array.from(atob(padded), (ch) => ch.charCodeAt(0));
};

async function squeeze(text) {
  if (typeof CompressionStream === "undefined") return { tag: "u", bytes: new TextEncoder().encode(text) };
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  return { tag: "z", bytes: new Uint8Array(await new Response(stream).arrayBuffer()) };
}

async function unsqueeze(tag, bytes) {
  if (tag === "u") return new TextDecoder().decode(bytes);
  if (typeof DecompressionStream === "undefined") throw new Error("no DecompressionStream");
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return await new Response(stream).text();
}

export async function encodeProfile(profile) {
  const packed = {};
  for (const [long, short] of Object.entries(PACK)) {
    const v = profile[long];
    if (v === undefined || v === null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    packed[short] = typeof v === "boolean" ? (v ? 1 : 0) : v;
  }
  const { tag, bytes } = await squeeze(JSON.stringify(packed));
  return VERSION + tag + b64url(bytes);
}

/* Returns null rather than throwing: a mangled link should land you on the
   ordinary page, not an error. */
export async function decodeProfile(code, isKnownSchool = () => true) {
  try {
    if (!code || code[0] !== VERSION) return null;
    const json = await unsqueeze(code[1], unb64url(code.slice(2)));
    const packed = JSON.parse(json);
    const out = {};
    for (const [short, v] of Object.entries(packed)) {
      const long = UNPACK[short];
      if (!long) continue;
      out[long] = long === "agreement" ? Boolean(v) : v;
    }
    if (typeof out.gpa !== "number" || typeof out.credits !== "number") return null;
    /* Empty arrays are left out of the packing to save bytes, so they have to
       come back as empty rather than missing — otherwise a shared empty list
       would fall through to the example list on the other end. */
    out.list = Array.isArray(out.list) ? out.list.filter(isKnownSchool) : [];
    if (!Array.isArray(out.context)) out.context = [];
    return out;
  } catch {
    return null;
  }
}

/* The link to hand over, and the reason it might not work from here. */
export async function shareLink(profile, loc = window.location) {
  const code = await encodeProfile(profile);
  const base = loc.origin === "null" || loc.protocol === "file:"
    ? loc.href.split("#")[0]
    : loc.origin + loc.pathname;
  const url = `${base}#r=${code}`;
  let caveat = null;
  if (loc.protocol === "file:") caveat = "This copy is a file on your own machine, so the link only opens for you. On the published site it works for anyone.";
  else if (window.top !== window.self) caveat = "Inside a preview frame this link points at the frame. On the published site it points at the page.";
  return { url, code, caveat };
}

export const readHash = (hash = window.location.hash) =>
  (hash.startsWith("#r=") ? hash.slice(3) : null);
