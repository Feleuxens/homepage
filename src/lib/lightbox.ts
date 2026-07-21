let dialog: HTMLDialogElement | null = null;
let imageEl: HTMLImageElement;
let captionEl: HTMLElement;
let spinnerEl: HTMLElement;
let initialized = false;

// Invalidates in-flight loads when the user closes or opens another image.
let requestId = 0;


function build(): HTMLDialogElement {
    const d = document.createElement("dialog");
    d.className =
        "backdrop:bg-black/95 bg-transparent max-w-none max-h-none w-full h-full p-4 " +
        "hidden open:flex items-center justify-center";
    d.innerHTML = `
    <div class="relative flex flex-col items-center gap-2">
      <img data-lb-image alt="" class="max-w-full max-h-[80dvh] object-contain rounded-lg" />
      <div data-lb-spinner class="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <span class="loading-spinner"></span>
      </div>
      <p data-lb-caption class="text-gray-200 text-center"></p>
    </div>`;

    imageEl = d.querySelector("[data-lb-image]")!;
    captionEl = d.querySelector("[data-lb-caption]")!;
    spinnerEl = d.querySelector("[data-lb-spinner]")!;

    d.addEventListener("click", (e) => {
        // Don't swallow clicks on the "Original" link.
        if ((e.target as HTMLElement).closest("a")) return;
        d.close();
    });

    d.addEventListener("close", () => {
        requestId++;  // invalidate any in-flight load
        imageEl.removeAttribute("src");  // cancel the download
        imageEl.alt = "";  // nothing to render if it's ever visible
        captionEl.replaceChildren();
        spinnerEl.classList.add("hidden");
        document.documentElement.style.overflow = "";
    });

    document.body.append(d);
    return d;
}

function setCaption(exif: string, original: string) {
    const link = document.createElement("a");
    link.href = original;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "Original";

    captionEl.replaceChildren(document.createTextNode(exif + ": "), link);
}

async function open(trigger: HTMLElement, thumbSrc: string) {
    const { full, w, h, caption, original, alt } = trigger.dataset;

    if (!full || !full.startsWith("/")) {
        console.error("[lightbox] bad data-full:", full, trigger);
        return;
    }

    dialog ??= build();
    const token = ++requestId;

    const width = Number(w);
    const height = Number(h);
    if (width > 0 && height > 0) {
        imageEl.width = width;
        imageEl.height = height;
    }

    imageEl.src = thumbSrc; // already cached, paints immediately
    imageEl.alt = alt ?? "";
    setCaption(caption ?? "No exif data", original ?? full);

    document.documentElement.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();
    spinnerEl.classList.remove("hidden");

    try {
        const fullImage = new Image();
        fullImage.src = full;
        await fullImage.decode();
        if (token === requestId) imageEl.src = full;
    } catch (err) {
        // Keep the thumbnail visible instead of showing an empty frame.
        console.error("[lightbox] full-size load failed:", full, err);
    } finally {
        if (token === requestId) spinnerEl.classList.add("hidden");
    }
}

export function initLightbox() {
    if (initialized) return;
    initialized = true;

    document.addEventListener("click", (e) => {
        const trigger = (e.target as HTMLElement).closest<HTMLElement>("[data-lightbox]");
        if (!trigger) return;

        const thumb = trigger.querySelector("img");
        open(trigger, thumb?.currentSrc || thumb?.src || "");
    });
}
