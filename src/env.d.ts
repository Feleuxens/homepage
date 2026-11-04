// Plausible analytics: the snippet in MainLayout defines this on every page and queues
// events until the script has loaded.
interface PlausibleFunction {
  (...args: unknown[]): void;
  q?: unknown[];
}

interface Window {
  plausible: PlausibleFunction;
}
