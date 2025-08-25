export function formatDuration(duration: number): string {
  const durationSecs = duration / 1000;
  const hours = Math.floor(durationSecs / 3600);
  const minutes = Math.floor((durationSecs % 3600) / 60);
  const seconds = Math.floor(durationSecs % 60);

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
    return `${duration}ms`;
  } else {
    return segments.join(' ');
  }
}

export function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 80%, 50%)`;
}


export function formatTime(time: number, includeDate: boolean = false): string {
  const date = new Date(time);
  if (includeDate) {
    return date.toLocaleString([], { hour: '2-digit', minute: '2-digit', year: 'numeric', month: '2-digit', day: '2-digit' });
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}