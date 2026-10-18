import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBooking, moneyToCents, centsToMoney, orderTransitions } from '../src/domain.js';
import { parse, orderSchema, registerSchema, menuSchema } from '../src/validation.js';
test('money calculations keep satang exact', () => {
  assert.equal(centsToMoney(moneyToCents('10.10') * 3 + moneyToCents('0.20')), '30.50');
});
test('reservation validates real date, Bangkok start time, slot and booking window', () => {
  const now = new Date('2026-01-01T00:00:00Z');
  assert.doesNotThrow(() => validateBooking('2026-01-01', '11:00', now));
  for (const [date, slot] of [['2026-02-30', '11:00'], ['2026-01-01', '11:30'], ['2025-12-31', '11:00'], ['2026-05-01', '11:00']]) assert.throws(() => validateBooking(date, slot, now));
  assert.throws(() => validateBooking('2026-01-01', '11:00', new Date('2026-01-01T04:00:00Z')));
});
test('orders reject duplicate lines, negative amounts and caller-supplied total', () => {
  for (const body of [
    { items: [{ menu_item_id: 1, quantity: 1 }, { menu_item_id: 1, quantity: 2 }] },
    { items: [{ menu_item_id: 1, quantity: -1 }] },
    { items: [{ menu_item_id: 1, quantity: 1 }], total: 1 },
  ]) assert.throws(() => parse(orderSchema, body));
});
test('registration cannot set an admin role or silently truncate a UTF-8 password', () => {
  assert.throws(() => parse(registerSchema, { name: 'A', email: 'a@example.com', password: 'Password123', role: 'admin' }));
  assert.throws(() => parse(registerSchema, { name: 'A', email: 'a@example.com', password: 'ก'.repeat(30) }));
});
test('menu rejects fractional satang and unsafe image URL', () => {
  assert.throws(() => parse(menuSchema, { category_id: 1, name: 'A', price: 1.001 }));
  assert.throws(() => parse(menuSchema, { category_id: 1, name: 'A', price: 1, image_url: 'javascript:alert(1)' }));
});
test('completed orders cannot be reopened', () => assert.deepEqual(orderTransitions.completed, []));
