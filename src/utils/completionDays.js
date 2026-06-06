export function getDaysLeft(card) {
  const totalDays = Number(card?.completionDays);
  if (!Number.isFinite(totalDays) || totalDays <= 0) return null;

  const startRaw = card?.jobDate || card?.createdAt;
  if (!startRaw) return null;

  const start = new Date(startRaw);
  if (Number.isNaN(start.getTime())) return null;

  start.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const elapsed = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return totalDays - elapsed;
}

export function formatDaysLeftLabel(daysLeft) {
  if (daysLeft == null) return null;
  if (daysLeft > 1) return `${daysLeft} days left`;
  if (daysLeft === 1) return '1 day left';
  if (daysLeft === 0) return 'Due today';
  if (daysLeft === -1) return '1 day overdue';
  return `${Math.abs(daysLeft)} days overdue`;
}

export function getDaysLeftTone(daysLeft) {
  if (daysLeft == null) return 'neutral';
  if (daysLeft < 0) return 'overdue';
  if (daysLeft <= 1) return 'urgent';
  if (daysLeft <= 3) return 'warning';
  return 'ok';
}
