import ExifReader from 'exifreader';
import fs from 'fs/promises';
import path from 'path';
import chokidar, { FSWatcher } from 'chokidar';

export interface ExifData {
    camera?: string;
    lens?: string;
    aperture?: string;
    shutterSpeed?: string;
    iso?: number;
    focalLength?: string;
    dateTaken?: string;
    dateIso?: string;
    location? : string;
    longitude?: string;
    latitude?: string;
    exposureBiasValue?: string;
    height: number;
    width: number;
    aspectRatio: number;
    caption: string;
}

function formatExifString(exifData: ExifData): string {
    let returnString = "";
    if (exifData["camera"]) returnString += exifData["camera"];
    if (exifData["lens"]) returnString += (" (" + exifData["lens"] + ")");
    if (exifData["focalLength"]) returnString += (", " + exifData["focalLength"]);
    if (exifData["shutterSpeed"]) returnString += (", " + exifData["shutterSpeed"]);
    if (exifData["aperture"]) returnString += (", " + exifData["aperture"]);
    if (exifData["iso"]) returnString += (", ISO " + exifData["iso"]);
    if (exifData["exposureBiasValue"]) returnString += (", " + exifData["exposureBiasValue"]);
    return returnString;
}

async function extractExifData(imagePath: string): Promise<ExifData | undefined> {
    try {
        const imageBuffer = await fs.readFile(imagePath);
        const tags = ExifReader.load(imageBuffer);
        const getTag = (tagName: string): string | undefined => {
            const tag = tags[tagName];
            return tag ? tag.description || tag.value : undefined;
        };

        const formatShutterSpeed = (exposureTime: string | undefined) => {
            if (!exposureTime) return undefined;
            if (!exposureTime.endsWith('s')) return exposureTime + "s";
            return exposureTime;
        };

        const formatDate = (dateString: string | undefined, offset: string | undefined, localeDate: boolean = false): string | undefined => {
            if (!dateString) return undefined;
            try {
                dateString = dateString.trim();

                let dateArray = dateString.split(' ');
                dateArray[0] = dateArray[0].replace(':', '-');

                if (!offset) offset = "";

                const date = new Date(dateArray[0] + " " + dateArray[1] + " " + offset);
                if (localeDate) {
                    return date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    });
                } else {
                    return date.toISOString();
                }
            } catch {
                return dateString;
            }
        };

        const mapCamera = (camera: string | undefined): string | undefined => {
            if (!camera) return undefined;
            switch (camera) {
                case "FC3170":
                    return "DJI Mavic Air 2";
                default:
                    return camera;
            }
        };

        const getIso = (): number | undefined => {
            let iso = getTag('ISO') || getTag('ISOSpeedRatings') || getTag('ISOSpeed');
            if (iso) {
                return Number(iso);
            }
            return undefined;
        }

        const formatExposureBias = (bias: string | undefined) => {
            if (!bias) return undefined;
            let chars = 1;
            if (bias.startsWith('-')) chars += 1;
            if (bias.includes('.')) chars += 2;
            return bias.substring(0, chars) + " EV";
        };

        const h = Number(getTag('Image Height')?.replace('px', ''));
        const w = Number(getTag('Image Width')?.replace('px', ''));

        const exifData: ExifData = {
            camera: mapCamera(getTag('Model') || getTag('Camera Model Name')),
            lens: getTag('LensModel') || getTag('LensInfo') || getTag('LensSpecification'),
            aperture: getTag('FNumber') || "f/?",
            shutterSpeed: formatShutterSpeed(getTag('ExposureTime')),
            iso: getIso(),
            focalLength: getTag('FocalLength'),
            dateTaken: formatDate(getTag('DateTime') || getTag('DateTimeOriginal') || getTag('DateTimeDigitized'), getTag("OffsetTime") || getTag("OffsetTimeOriginal") || getTag("OffsetTimeDigitized"), true),
            dateIso: formatDate(getTag('DateTimeDigitized') || getTag('DateTimeOriginal') || getTag('DateTime'), getTag("OffsetTime") || getTag("OffsetTimeOriginal") || getTag("OffsetTimeDigitized"), false),
            location: getTag('GPS Position') || getTag('Location'),
            exposureBiasValue: formatExposureBias(getTag('ExposureBiasValue')),
            // latitude: getTag('GPSLatitude'),
            // longitude: getTag('GPSLongitude'),
            height: h,
            width: w,
            aspectRatio: h && w ? h / w : 1,
            caption: "",
        };

        exifData.caption = formatExifString(exifData);

        return exifData;

    } catch (error) {
        console.error(`Error extracting EXIF from ${imagePath}:`, error);
    }
}

async function generateExifData(originalsDir: string[] = ['public/images/photography/originals'], outputFile: string = 'src/data/exif-data.ts') {
    try {
        // Ensure the data directory exists
        await fs.mkdir(path.dirname(outputFile), { recursive: true });

        const files = [];
        for (const dir of originalsDir) {
            for (const file of await fs.readdir(dir)) {
                files.push(dir + "/" + file);
            }
        }
        const imageFiles = files.filter(file =>
            /\.(jpg|jpeg|tiff)$/i.test(file)
        );

        const allExifData: { [key: string]: ExifData} = {};

        for (const file of imageFiles) {
            const exifData: ExifData | undefined = await extractExifData(file);
            if (!exifData) continue;

            if (Object.keys(exifData).length > 0) {
                allExifData[file] = exifData;
            }
        }

        // Generate TypeScript file with EXIF data
        const tsContent = `// Auto-generated EXIF data
// This file is automatically generated by the Astro EXIF integration
// Do not edit manually - changes will be overwritten

import type { ExifData } from "../lib/exif-reader.ts";

export const exifData: { [key: string]: ExifData } = ${JSON.stringify(allExifData, null, 2)};
`;

        await fs.writeFile(outputFile, tsContent);
        console.log(`✅ EXIF data generated for ${Object.keys(allExifData).length} images`);

        return allExifData;

    } catch (error) {
        console.error('❌ Error generating EXIF data:', error);
        return {};
    }
}

export function exifExtractor(options: { originalsDir?: string[], outputFile?: string, watchForChanges?: boolean } = {}) {
    const {
        originalsDir = ['src/images/photography/originals'],
        outputFile = 'src/data/exif-data.ts',
        watchForChanges = true
    } = options;

    let watcher: FSWatcher;

    return {
        name: 'exif-extractor',
        hooks: {
            'astro:config:setup': async ({ command }: { command: string }) => {
                console.log('🔍 EXIF Extractor: Initializing...');

                // Generate EXIF data on startup
                await generateExifData(originalsDir, outputFile);

                // Watch for changes in development mode
                if (command === 'dev' && watchForChanges) {
                    console.log(`👀 EXIF Extractor: Watching ${originalsDir} for changes...`);

                    watcher = chokidar.watch(originalsDir, {
                        ignored: /(^|[\/\\])\../, // ignore dotfiles
                        persistent: true
                    });

                    watcher
                        .on('add', async () => {
                            await generateExifData(originalsDir, outputFile);
                        })
                        .on('change', async () => {
                            await generateExifData(originalsDir, outputFile);
                        })
                        .on('unlink', async () => {
                            await generateExifData(originalsDir, outputFile);
                        });
                }
            },
            'astro:build:start': async () => {
                console.log('🔍 EXIF Extractor: Generating EXIF data for build...');
                await generateExifData(originalsDir, outputFile);
            },
            'astro:build:done': () => {
                if (watcher) {
                    watcher.close();
                }
            }
        }
    };
}