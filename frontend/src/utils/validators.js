// ─── utils/validators.js ──────────────────────────────────────────────────────
// Form schemas using Zod validation. Maps to backend validator structures.

import * as z from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long'),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name must not exceed 100 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long'),
});

export const jobSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Job title is required')
      .max(150, 'Job title must not exceed 150 characters'),
    department: z.enum(['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance'], {
      errorMap: () => ({ message: 'Please select a valid department' }),
    }),
    location: z
      .string()
      .trim()
      .min(1, 'Location is required')
      .max(100, 'Location must not exceed 100 characters'),
    jobType: z.enum(['full-time', 'part-time', 'contract', 'remote'], {
      errorMap: () => ({ message: 'Please select a valid job type' }),
    }),
    isRemote: z.boolean().default(false),
    experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead']).default('mid'),
    description: z
      .string()
      .trim()
      .min(1, 'Job description is required')
      .max(10000, 'Description must not exceed 10000 characters'),
    salaryMin: z
      .preprocess((val) => (val === '' ? null : Number(val)), z.number().min(0, 'Minimum salary cannot be negative').nullable())
      .optional(),
    salaryMax: z
      .preprocess((val) => (val === '' ? null : Number(val)), z.number().min(0, 'Maximum salary cannot be negative').nullable())
      .optional(),
    applicationDeadline: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val) return true;
          // Set to start of today to allow selecting today's date
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return new Date(val) >= today;
        },
        { message: 'Application deadline must be today or in the future' }
      ),
    status: z.enum(['draft', 'published', 'closed', 'archived']).default('draft'),
  })
  .refine(
    (data) => {
      if (
        data.salaryMin !== null &&
        data.salaryMin !== undefined &&
        data.salaryMax !== null &&
        data.salaryMax !== undefined &&
        data.salaryMax < data.salaryMin
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Maximum salary must be greater than or equal to minimum salary',
      path: ['salaryMax'],
    }
  );
