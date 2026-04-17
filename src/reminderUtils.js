// Shared helpers for reminder offset objects: { value: number, unit: 'days'|'hours'|'minutes' }

export const REMINDER_UNITS = [
  { key: 'days', label: 'days', singular: 'day' },
  { key: 'hours', label: 'hours', singular: 'hour' },
  { key: 'minutes', label: 'minutes', singular: 'minute' },
];

export function offsetToTrigger(offset) {
  if (offset.unit === 'days') return `-P${offset.value}D`;
  if (offset.unit === 'hours') return `-PT${offset.value}H`;
  if (offset.unit === 'minutes') return `-PT${offset.value}M`;
  return '-PT0M';
}

export function offsetToLabel(offset) {
  const unit = REMINDER_UNITS.find((u) => u.key === offset.unit) || REMINDER_UNITS[0];
  const noun = offset.value === 1 ? unit.singular : unit.label;
  return `${offset.value} ${noun} before`;
}

export function offsetToShortLabel(offset) {
  const unit = REMINDER_UNITS.find((u) => u.key === offset.unit) || REMINDER_UNITS[0];
  const short = unit.key === 'days' ? 'd' : unit.key === 'hours' ? 'h' : 'm';
  return `${offset.value}${short}`;
}

export function offsetToMinutes(offset) {
  if (offset.unit === 'days') return offset.value * 1440;
  if (offset.unit === 'hours') return offset.value * 60;
  return offset.value;
}

export function sortOffsets(offsets) {
  return [...offsets].sort((a, b) => offsetToMinutes(b) - offsetToMinutes(a));
}
