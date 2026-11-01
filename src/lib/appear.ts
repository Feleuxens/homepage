// Plays the .appear / .appear-grow entrances from src/styles/motion.css once, as elements
// scroll into view. This module only decides *when*; the animation itself lives in CSS.
// Elements that enter together are staggered in reading order via --appear-order.

const SELECTOR = ".appear, .appear-grow";
const READY_CLASS = "appear-ready";
const VISIBLE_CLASS = "is-visible";

// The detection area reaches far above the screen, so anything scrolled past also counts as
// seen, even when a jump (End key, anchor link, fast fling) skips over it entirely.
// The bottom edge sits 5% above the screen's bottom, so elements start once properly in view.
const ROOT_MARGIN = "100000px 0px -5% 0px";

export function initAppear(): void {
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(entries => {
        const entered = entries.filter(entry => entry.isIntersecting);

        // Elements already above the screen show at once; only those on screen are staggered
        entered
            .filter(entry => entry.boundingClientRect.bottom <= 0)
            .forEach(entry => show(entry.target as HTMLElement, 0));

        entered
            .filter(entry => entry.boundingClientRect.bottom > 0)
            .map(entry => entry.target as HTMLElement)
            .sort(byReadingOrder)
            .forEach(show);
    }, { rootMargin: ROOT_MARGIN });

    function show(el: HTMLElement, order: number): void {
        el.style.setProperty("--appear-order", String(order));
        el.classList.add(VISIBLE_CLASS);
        observer.unobserve(el);
    }

    document.documentElement.classList.add(READY_CLASS);
    document.querySelectorAll(SELECTOR).forEach(el => observer.observe(el));
}

function byReadingOrder(a: Element, b: Element): number {
    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();
    return ra.top - rb.top || ra.left - rb.left;
}
