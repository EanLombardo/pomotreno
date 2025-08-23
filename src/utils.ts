export function formatDuration(duration: number): string {
  duration = duration / 1000;
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);

  const segments: string[] = [];
  if (hours) {
    segments.push(`${hours}h`);
  }
  if (minutes) {
    segments.push(`${minutes}m`);
  }
  if (seconds) {
    segments.push(`${seconds}s`);
  }

  if (segments.length === 0) {
    return '0s';
  } else {
    return segments.join(' ');
  }
}

export function formatTime(time :number) : string {
  const date = new Date(time);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}