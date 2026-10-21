const SCANS_KEY = "jukebox_scans";
const NICKNAMES_KEY = "jukebox_nicknames";

interface Scan {
  barcode: string;
  scannedAt: string;
}

function getScans(): Scan[] {
  const raw = localStorage.getItem(SCANS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function setScans(scans: Scan[]): void {
  localStorage.setItem(SCANS_KEY, JSON.stringify(scans));
}

function getNicknamesMap(): Record<string, string> {
  const raw = localStorage.getItem(NICKNAMES_KEY);
  return raw ? JSON.parse(raw) : {};
}

export function initDatabase(): void {
  // Clean up records older than 7 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const scans = getScans().filter((s) => new Date(s.scannedAt) >= cutoff);
  setScans(scans);
}

export function getPlayCountToday(barcode: string): number {
  const today = new Date().toISOString().split("T")[0]!;
  return getScans().filter(
    (s) => s.barcode === barcode && s.scannedAt.startsWith(today),
  ).length;
}

export function recordPlay(barcode: string): void {
  const scans = getScans();
  scans.push({ barcode, scannedAt: new Date().toISOString() });
  setScans(scans);
}

export function getNickname(barcode: string): string | null {
  return getNicknamesMap()[barcode] ?? null;
}

export function saveNickname(barcode: string, name: string): void {
  const map = getNicknamesMap();
  if (!map[barcode]) {
    map[barcode] = name;
    localStorage.setItem(NICKNAMES_KEY, JSON.stringify(map));
  }
}
