import { z } from 'zod';
import { HttpError, slots } from './domain.js';
export const id = z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).pipe(z.number().int().positive().max(2147483647));
export const pagination = req => parse(z.object({ limit: z.coerce.number().int().min(1).max(100).default(50), offset: z.coerce.number().int().min(0).max(1000000).default(0) }), req.query);
export const categorySchema = z.object({ name: z.string().trim().min(1).max(100) }).strict();
export const tableSchema = z.object({ table_number: z.string().trim().min(1).max(20), capacity: z.number().int().min(1).max(20), is_active: z.boolean().default(true) }).strict();
export function parse(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) throw new HttpError(400, result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '));
  return result.data;
}
export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100), email: z.email().max(190).transform(v => v.toLowerCase()),
  password: z.string().min(8).max(72).refine(v => Buffer.byteLength(v, 'utf8') <= 72, 'Password exceeds 72 UTF-8 bytes'),
}).strict();
export const loginSchema = registerSchema.pick({ email: true, password: true });
export const menuSchema = z.object({
  category_id: id, name: z.string().trim().min(1).max(150),
  description: z.string().max(2000).default(''),
  price: z.number().positive().max(999999.99).refine(v => Math.abs(v * 100 - Math.round(v * 100)) < 0.000001, 'Use at most 2 decimal places'),
  image_url: z.url().max(1000).refine(v => /^https?:\/\//.test(v)).nullable().default(null),
  is_available: z.boolean().default(true),
}).strict();
export const bookingSchema = z.object({
  table_id: id, date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: z.enum(slots), guests: z.number().int().min(1).max(20),
  note: z.string().max(500).default(''),
}).strict();
export const availabilitySchema = bookingSchema.pick({ date: true, slot: true }).extend({ guests: z.coerce.number().int().min(1).max(20).default(1) });
export const orderSchema = z.object({
  reservation_id: id.optional(),
  items: z.array(z.object({ menu_item_id: id, quantity: z.number().int().min(1).max(99) }).strict()).min(1).max(50)
    .refine(items => new Set(items.map(i => i.menu_item_id)).size === items.length, 'Duplicate menu items are not allowed'),
  note: z.string().max(500).default(''),
}).strict();
