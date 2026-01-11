import { z } from 'zod';

/**
 * Contact form validation schema
 * Uses permissive validation for email and phone formats
 */
export const contactSchema = z.object({
	name: z.string().min(3, 'contacts.nameMinLength').max(150, 'contacts.nameMaxLength').trim(),
	email: z
		.string()
		.min(1, 'contacts.emailRequired')
		.email('contacts.emailInvalid')
		.max(255, 'contacts.emailMaxLength')
		.trim(),
	phone: z.string().min(1, 'contacts.phoneRequired').max(20, 'contacts.phoneMaxLength').trim(),
	notes: z.string().max(1000, 'contacts.notesMaxLength').optional().default('')
});

export type ContactFormData = z.infer<typeof contactSchema>;
