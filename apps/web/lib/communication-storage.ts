const QUEUE_RESUME_KEY = 'vemtap:queue:resume';

interface QueuePosition {
  queueId: string;
  itemId: string;
  at: string;
}

export function saveQueuePosition(queueId: string, itemId: string): void {
  try {
    localStorage.setItem(QUEUE_RESUME_KEY, JSON.stringify({ queueId, itemId, at: new Date().toISOString() }));
  } catch {
    /* storage unavailable */
  }
}

export function getQueuePosition(): QueuePosition | null {
  try {
    const raw = localStorage.getItem(QUEUE_RESUME_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as QueuePosition;
  } catch {
    return null;
  }
}

export function clearQueuePosition(): void {
  try {
    localStorage.removeItem(QUEUE_RESUME_KEY);
  } catch {
    /* storage unavailable */
  }
}