import { z } from 'zod';

const optionalText = (max) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : null));

const optionalId = z
  .union([z.literal(''), z.coerce.number().int().positive()])
  .optional()
  .transform((v) => (v ? v : null));

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  srn: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^PES[0-9]UG[0-9]{2}[A-Z]{2}[0-9]{3}$/, 'SRN should look like PES1UG24CS045'),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+ -]{7,15}$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('').transform(() => null)),
  deptId: z.coerce.number().int().positive('Choose your department'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[0-9]/, 'Password needs at least one number'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

const today = () => new Date().toLocaleDateString('en-CA'); // local YYYY-MM-DD

export const itemSchema = z
  .object({
    reportType: z.enum(['lost', 'found'], { message: 'Choose lost or found' }),
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
    description: z.string().trim().min(10, 'Description must be at least 10 characters').max(2000),
    categoryId: z.coerce.number().int().positive('Choose a category'),
    locationId: z.coerce.number().int().positive('Choose where it happened'),
    storageLocationId: optionalId,
    color: optionalText(30),
    brand: optionalText(50),
    eventDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date')
      .refine((d) => d <= today(), 'The date cannot be in the future'),
    question: optionalText(200),
    answer: optionalText(200),
  })
  .refine((v) => v.reportType === 'lost' || v.storageLocationId, {
    message: 'Say where you handed the item in',
    path: ['storageLocationId'],
  })
  .refine((v) => !v.question === !v.answer, {
    message: 'Give both a verification question and its answer, or neither',
    path: ['answer'],
  })
  .transform((v) =>
    v.reportType === 'lost' ? { ...v, storageLocationId: null, question: null, answer: null } : v,
  );

export const claimSchema = z.object({
  proofDetails: z.string().trim().min(10, 'Describe your proof in at least 10 characters').max(1000),
  answer: optionalText(200),
  lostItemId: optionalId,
});

export const reviewSchema = z.object({
  action: z.enum(['approve', 'reject', 'withdraw']),
  note: optionalText(300),
});

export const handoverSchema = z.object({
  locationId: z.coerce.number().int().positive('Choose the handover point'),
  notes: optionalText(300),
});

export const userUpdateSchema = z.object({
  role: z.enum(['student', 'staff', 'admin']).optional(),
  isActive: z.boolean().optional(),
});
