export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const slots = ['11:00', '12:30', '14:00', '17:00', '18:30', '20:00'];
export function validateBooking(date, slot, now = new Date()) {
  const start = new Date(`${date}T${slot}:00+07:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(start.getTime()) ||
      new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
    throw new HttpError(400, 'Invalid booking date');
  }
  if (!slots.includes(slot)) throw new HttpError(400, 'Invalid reservation slot');
  if (start <= now) throw new HttpError(400, 'Reservation must be in the future');
  if (start - now > 90 * 86400000) throw new HttpError(400, 'Book at most 90 days ahead');
}
export function moneyToCents(value) {
  const [whole, decimal = ''] = String(value).split('.');
  return Number(whole) * 100 + Number(decimal.padEnd(2, '0').slice(0, 2));
}
export function centsToMoney(value) { return (value / 100).toFixed(2); }
export const orderTransitions = {
  pending: ['confirmed', 'cancelled'], confirmed: ['preparing', 'cancelled'],
  preparing: ['ready'], ready: ['completed'], completed: [], cancelled: [],
};
