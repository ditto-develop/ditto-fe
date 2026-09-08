/**
 * 임시 진단용 인메모리 로그 버퍼.
 *
 * Safari 웹 인스펙터에 접근할 수 없는 상황에서, 이미 심어둔 진단 로그를 화면(DebugOverlay)에서도
 * 볼 수 있게 하기 위한 것이다. 원인 파악이 끝나면 이 파일과 DebugOverlay, 호출부를 통째로 제거한다.
 */

export type DebugLogEntry = {
  id: number;
  time: string;
  message: string;
};

const MAX_ENTRIES = 50;
let entries: DebugLogEntry[] = [];
let nextId = 1;

type Listener = (entries: DebugLogEntry[]) => void;
const listeners = new Set<Listener>();

function stringifyArg(arg: unknown): string {
  if (typeof arg === "string") return arg;
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

/** console.log/error를 대신해 호출한다 — 콘솔에도 그대로 찍히고, 화면 오버레이에도 쌓인다. */
export function debugLog(...args: unknown[]): void {
  console.log(...args);
  const message = args.map(stringifyArg).join(" ");
  const entry: DebugLogEntry = {
    id: nextId++,
    time: new Date().toLocaleTimeString("ko-KR", { hour12: false }),
    message,
  };
  entries = [...entries, entry].slice(-MAX_ENTRIES);
  listeners.forEach((listener) => listener(entries));
}

export function getDebugLogEntries(): DebugLogEntry[] {
  return entries;
}

export function clearDebugLogEntries(): void {
  entries = [];
  listeners.forEach((listener) => listener(entries));
}

export function subscribeDebugLog(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
