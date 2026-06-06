export interface Album {
    name: string;
    url: string;
    image_count: number;
    cover: string;
    when: string;
    date?: string;
}

const ENDPOINT =
    process.env.CHEVERETO_ALBUMS_URL ??
    import.meta.env.CHEVERETO_ALBUMS_URL ??
    "https://photo.feleuxens.de/latestalbums";
const TTL = 5 * 60 * 1000;  // 5 minutes
const TIMEOUT = 4000;  // 4s

let cache: { at: number; albums: Album[] } | null = null;

async function fetchAlbums(): Promise<Album[]> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
    try {
        const res = await fetch(ENDPOINT, { signal: ctrl.signal });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        const list: Album[] = Array.isArray(data) ? data : data.albums ?? [];
        // normalize cover scheme to https
        return list.map((a) => ({
            ...a,
            cover: (a.cover || "").replace(/^http:\/\//, "https://"),
            name: (a.name || "").replace("amp;", ""),
        }));
    } finally {
        clearTimeout(timer);
    }
}

export async function getAlbums(): Promise<Album[]> {
    if (cache && Date.now() - cache.at < TTL) {
        return cache.albums;
    }
    try {
        const albums = await fetchAlbums();
        cache = { at: Date.now(), albums };
        return albums;
    } catch (err) {
        console.error("getAlbums failed:", err);
        return cache?.albums ?? []; // serve last-known-good, or empty
    }
}
