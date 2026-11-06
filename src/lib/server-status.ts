// Real facts for the IT page, read on the server at request time. Only ever shows measured
// values: if the registry can't be reached, the page says so instead of guessing.
import { uptime } from "node:os";

const IMAGE = "feleuxens/homepage";
const REGISTRY = "https://ghcr.io";
const TTL = 10 * 60 * 1000; // 10 minutes
const TIMEOUT = 5000;

const MANIFEST_TYPES = [
  "application/vnd.oci.image.index.v1+json",
  "application/vnd.oci.image.manifest.v1+json",
  "application/vnd.docker.distribution.manifest.list.v2+json",
  "application/vnd.docker.distribution.manifest.v2+json",
].join(", ");

async function json(url: string, signal: AbortSignal, headers: Record<string, string> = {}) {
  const res = await fetch(url, { signal, headers });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

/** The public image needs an anonymous token, then manifest index → manifest → config, which holds the build time. */
async function fetchImageBuildTime(): Promise<Date> {
  const signal = AbortSignal.timeout(TIMEOUT);
  const { token } = await json(`${REGISTRY}/token?scope=repository:${IMAGE}:pull`, signal);
  const base = `${REGISTRY}/v2/${IMAGE}`;
  const headers = { Authorization: `Bearer ${token}`, Accept: MANIFEST_TYPES };

  let manifest = await json(`${base}/manifests/latest`, signal, headers);
  if (manifest.manifests) {
    const image = manifest.manifests.find((m: { platform?: { os?: string; architecture?: string } }) =>
      m.platform?.os === "linux" && m.platform?.architecture === "amd64");
    if (!image) throw new Error("No linux/amd64 image in the manifest index");
    manifest = await json(`${base}/manifests/${image.digest}`, signal, headers);
  }

  const config = await json(`${base}/blobs/${manifest.config.digest}`, signal, { Authorization: headers.Authorization });
  const built = new Date(config.created);
  if (Number.isNaN(built.getTime())) throw new Error("Image config has no valid build time");
  return built;
}

let cache: { at: number; built: Date | null } | null = null;

async function getImageBuildTime(): Promise<Date | null> {
  if (cache && Date.now() - cache.at < TTL) return cache.built;
  try {
    cache = { at: Date.now(), built: await fetchImageBuildTime() };
  } catch (err) {
    console.error("getImageBuildTime failed:", err);
    cache = { at: Date.now(), built: cache?.built ?? null }; // last known value, or nothing
  }
  return cache.built;
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [["day", 86400], ["hour", 3600], ["minute", 60]];

/** The largest whole unit: "12 days", "1 hour". */
function largestUnit(seconds: number): [number, Intl.RelativeTimeFormatUnit] {
  for (const [unit, size] of UNITS) {
    if (seconds >= size) return [Math.floor(seconds / size), unit];
  }
  return [Math.floor(seconds), "second"];
}

export function formatDuration(seconds: number): string {
  const [value, unit] = largestUnit(seconds);
  return `${value} ${unit}${value === 1 ? "" : "s"}`;
}

export function formatAgo(date: Date): string {
  const [value, unit] = largestUnit(Math.max(0, (Date.now() - date.getTime()) / 1000));
  return new Intl.RelativeTimeFormat("en").format(-value, unit);
}

export async function getServerStatus() {
  return { uptimeSeconds: uptime(), imageBuilt: await getImageBuildTime() };
}
