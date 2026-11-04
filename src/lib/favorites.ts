// The favourite photographs in public/images/photography/favorites, with their EXIF metadata.
// Shared by the photography gallery and the homepage, so both always show the same set.
import { exifData } from "../data/exif-data";

export const FAVORITES_FOLDER = "/images/photography/favorites/";

export interface FavoritePhoto {
    src: ImageMetadata;
    filename: string;
    /** height / width, from EXIF; undefined when the file has no EXIF data */
    aspectRatio?: number;
    /** Capture time in ms since epoch, 0 when unknown */
    date: number;
}

const modules = import.meta.glob<{ default: ImageMetadata }>(
    "../../public/images/photography/favorites/*.{jpg,jpeg,png,webp,JPG}",
    { eager: true },
);

export function getFavoritePhotos(): FavoritePhoto[] {
    return Object.entries(modules).map(([path, module]) => {
        const filename = path.split("/").pop() ?? "";
        const exif = exifData["public" + FAVORITES_FOLDER + filename] ?? {};
        return {
            src: module.default,
            filename,
            aspectRatio: exif.aspectRatio,
            date: exif.dateIso ? Date.parse(exif.dateIso) : 0,
        };
    });
}

export function newestFirst(a: FavoritePhoto, b: FavoritePhoto): number {
    return b.date - a.date;
}

/** Shutter speed, aperture and focal length of a photo as one line. */
export function photoSettings(
    exif: { shutterSpeed?: string; aperture?: string; focalLength?: string },
    separator = " · ",
): string {
    return [exif.shutterSpeed, exif.aperture, exif.focalLength].filter(Boolean).join(separator);
}
