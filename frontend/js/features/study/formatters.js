// Dinh dang so giay thanh nhan ngan tren nut cham diem va dem nguoc.

// 30 -> "<1m", 600 -> "10m", 5400 -> "1.5h", 345600 -> "4d", 5184000 -> "2mo", 31536000 -> "1y"
export function formatInterval(seconds) {
  if (seconds < 60) return "<1m";
  if (seconds < 3600) return `${Math.min(59, Math.round(seconds / 60))}m`;
  if (seconds < 86400) return `${Number((seconds / 3600).toFixed(1))}h`;
  const days = seconds / 86400;
  if (days < 30) return `${Number(days.toFixed(1))}d`;
  if (days < 365) return `${Number((days / 30).toFixed(1))}mo`;
  return `${Number((days / 365).toFixed(1))}y`;
}

// 59000 ms -> "00:59"
export function formatCountdown(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
