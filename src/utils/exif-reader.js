// integrations/exif-extractor.js
import ExifReader from 'exifreader';
import fs from 'fs/promises';
import path from 'path';
import chokidar from 'chokidar';

function formatExifString(exifData) {
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

async function extractExifData(imagePath) {
    try {
        const imageBuffer = await fs.readFile(imagePath);
        const tags = ExifReader.load(imageBuffer);
        const getTag = (tagName) => {
            const tag = tags[tagName];
            return tag ? tag.description || tag.value : null;
        };

        const formatShutterSpeed = (exposureTime) => {
            if (!exposureTime) return null;
            if (!exposureTime.endsWith('s')) return exposureTime + "s";
            return exposureTime;
        };

        const formatDate = (dateString, offset, localeDate) => {
            if (!dateString) return null;
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

        const mapCamera = (camera) => {
            if (!camera) return null;
            switch (camera) {
                case "FC3170":
                    return "DJI Mavic Air 2";
                default:
                    return camera;
            }
        };

        const formatExposureBias = (bias) => {
            if (!bias) return null;
            let chars = 1;
            if (bias.startsWith('-')) chars += 1;
            if (bias.includes('.')) chars += 2;
            return bias.substring(0, chars) + " EV";
        };

        const exifData = {
            camera: mapCamera(getTag('Model') || getTag('Camera Model Name')),
            lens: getTag('LensModel') || getTag('LensInfo') || getTag('LensSpecification'),
            aperture: getTag('FNumber') || "f/?",
            shutterSpeed: formatShutterSpeed(getTag('ExposureTime')),
            iso: getTag('ISO') || getTag('ISOSpeedRatings') || getTag('ISOSpeed'),
            focalLength: getTag('FocalLength'),
            dateTaken: formatDate(getTag('DateTime') || getTag('DateTimeOriginal') || getTag('DateTimeDigitized'), getTag("OffsetTime") || getTag("OffsetTimeOriginal") || getTag("OffsetTimeDigitized") || null, true),
            dateIso: formatDate(getTag('DateTimeDigitized') || getTag('DateTimeOriginal') || getTag('DateTime'), getTag("OffsetTime") || getTag("OffsetTimeOriginal") || getTag("OffsetTimeDigitized") || null, false),
            location: getTag('GPS Position') || getTag('Location'),
            exposureBiasValue: formatExposureBias(getTag('ExposureBiasValue')),
            latitude: getTag('GPSLatitude'),
            longitude: getTag('GPSLongitude'),
            height: getTag('Image Height').replace('px', ''),
            width: getTag('Image Width').replace('px', ''),
            aspectRatio: getTag('Image Height').replace('px', '') / getTag('Image Width').replace('px', '') || 1
        };

        // Filter out null values
        const cleanedExif = {};
        Object.entries(exifData).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                cleanedExif[key] = value;
            }
        });
        cleanedExif["exif"] = formatExifString(cleanedExif);

        return cleanedExif;

    } catch (error) {
        console.error(`Error extracting EXIF from ${imagePath}:`, error);
        return {};
    }
}

async function generateExifData(originalsDir = ['public/images/photography/originals'], outputFile = 'src/data/exif-data.js') {
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

        const allExifData = {};

        for (const file of imageFiles) {
            const exifData = await extractExifData(file);

            if (Object.keys(exifData).length > 0) {
                allExifData[file] = exifData;
            }
        }

        // Generate JavaScript file with EXIF data
        const jsContent = `// Auto-generated EXIF data
// This file is automatically generated by the Astro EXIF integration
// Do not edit manually - changes will be overwritten

export const exifData = ${JSON.stringify(allExifData, null, 2)};
`;

        await fs.writeFile(outputFile, jsContent);
        console.log(`✅ EXIF data generated for ${Object.keys(allExifData).length} images`);

        return allExifData;

    } catch (error) {
        console.error('❌ Error generating EXIF data:', error);
        return {};
    }
}

export function exifExtractor(options = {}) {
    const {
        originalsDir = ['src/images/photography/originals'],
        outputFile = 'src/data/exif-data.js',
        watchForChanges = true
    } = options;

    let watcher;

    return {
        name: 'exif-extractor',
        hooks: {
            'astro:config:setup': async ({ command }) => {
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