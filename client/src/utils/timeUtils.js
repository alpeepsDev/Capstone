export const parseTime = (timeStr) => {
  if (!timeStr) return 0;

  // Regex to match "1w 2d 3h 4m" format
  const regex = /(\d+)\s*([wdhm])/g;
  let totalMinutes = 0;
  let match;

  while ((match = regex.exec(timeStr)) !== null) {
    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case "w":
        totalMinutes += value * 5 * 8 * 60; // 5 days, 8 hours
        break;
      case "d":
        totalMinutes += value * 8 * 60; // 8 hours
        break;
      case "h":
        totalMinutes += value * 60;
        break;
      case "m":
        totalMinutes += value;
        break;
    }
  }

  // If input is just a number, treat as hours or minutes?
  // Jira treats "5" as 5 hours usually? Or minutes?
  // Let's assume if no unit, treat as minutes if it's small, or hours?
  // Actually, let's just support the mocked format for now.
  // If regex didn't match anything but there is a number, assume hours like Jira
  if (totalMinutes === 0 && !isNaN(parseFloat(timeStr))) {
    totalMinutes = parseFloat(timeStr) * 60;
  }

  return totalMinutes;
};

export const formatTime = (minutes) => {
  if (!minutes) return "";

  const w = Math.floor(minutes / (5 * 8 * 60));
  minutes %= 5 * 8 * 60;

  const d = Math.floor(minutes / (8 * 60));
  minutes %= 8 * 60;

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  const parts = [];
  if (w > 0) parts.push(`${w}w`);
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);

  return parts.join(" ");
};
