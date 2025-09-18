/**
 * Validation Schemas for FleetLink
 * @fileoverview Zod validation schemas for all forms
 */

import { z } from 'zod';

/**
 * Vehicle form validation schema
 */
export const vehicleFormSchema = z.object({
    name: z
        .string()
        .min(2, 'Vehicle name must be at least 2 characters')
        .max(100, 'Vehicle name cannot exceed 100 characters')
        .trim(),
    capacityKg: z
        .number()
        .int('Capacity must be a whole number')
        .min(1, 'Capacity must be at least 1 kg')
        .max(50000, 'Capacity cannot exceed 50,000 kg'),
    tyres: z
        .number()
        .int('Number of tyres must be a whole number')
        .min(2, 'Vehicle must have at least 2 tyres')
        .max(18, 'Vehicle cannot have more than 18 tyres'),
});

/**
 * Vehicle search form validation schema
 */
export const vehicleSearchSchema = z.object({
    capacityRequired: z
        .number()
        .int('Capacity must be a whole number')
        .min(1, 'Capacity must be at least 1 kg')
        .max(50000, 'Capacity cannot exceed 50,000 kg')
        .optional(),
    fromPincode: z
        .string()
        .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits')
        .optional(),
    toPincode: z
        .string()
        .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits')
        .optional(),
    startTime: z
        .string()
        .min(1, 'Start time is required')
        .refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid date format')
        .refine((val) => {
            const date = new Date(val);
            return date > new Date();
        }, 'Start time must be in the future'),
}).refine((data) => {
    // If pincodes are provided, both must be provided
    if (data.fromPincode || data.toPincode) {
        return data.fromPincode && data.toPincode;
    }
    return true;
}, {
    message: 'Both from and to pincodes are required if either is provided',
    path: ['toPincode'],
});

/**
 * Booking form validation schema
 */
export const bookingFormSchema = z.object({
    vehicleId: z
        .string()
        .min(1, 'Vehicle ID is required'),
    fromPincode: z
        .string()
        .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
    toPincode: z
        .string()
        .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
    startTime: z
        .string()
        .min(1, 'Start time is required')
        .refine((val) => {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }, 'Invalid date format')
        .refine((val) => {
            const date = new Date(val);
            return date > new Date();
        }, 'Start time must be in the future'),
});

/**
 * User profile update validation schema
 */
export const userProfileSchema = z.object({
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name cannot exceed 100 characters')
        .trim()
        .optional(),
    email: z
        .string()
        .email('Invalid email format')
        .optional(),
});

/**
 * Password change validation schema
 */
export const passwordChangeSchema = z.object({
    currentPassword: z
        .string()
        .min(1, 'Current password is required'),
    newPassword: z
        .string()
        .min(8, 'New password must be at least 8 characters')
        .max(100, 'Password cannot exceed 100 characters'),
    confirmPassword: z
        .string()
        .min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

/**
 * Vehicle update validation schema
 */
export const vehicleUpdateSchema = z.object({
    name: z
        .string()
        .min(2, 'Vehicle name must be at least 2 characters')
        .max(100, 'Vehicle name cannot exceed 100 characters')
        .trim()
        .optional(),
    capacityKg: z
        .number()
        .int('Capacity must be a whole number')
        .min(1, 'Capacity must be at least 1 kg')
        .max(50000, 'Capacity cannot exceed 50,000 kg')
        .optional(),
    tyres: z
        .number()
        .int('Number of tyres must be a whole number')
        .min(2, 'Vehicle must have at least 2 tyres')
        .max(18, 'Vehicle cannot have more than 18 tyres')
        .optional(),
    isActive: z
        .boolean()
        .optional(),
});

/**
 * Helper function to validate form data
 * @param {Object} data - Data to validate
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Object} Validation result
 */
export const validateFormData = (data, schema) => {
    try {
        const validatedData = schema.parse(data);
        return { success: true, data: validatedData, errors: null };
    } catch (error) {
        if (error instanceof z.ZodError && error.errors) {
            const errors = error.errors.reduce((acc, err) => {
                const path = err.path ? err.path.join('.') : 'unknown';
                acc[path] = err.message;
                return acc;
            }, {});
            return { success: false, data: null, errors };
        }
        return { success: false, data: null, errors: { general: 'Validation failed' } };
    }
};

/**
 * Helper function to get field error
 * @param {Object} errors - Validation errors object
 * @param {string} fieldName - Field name to get error for
 * @returns {string|null} Error message or null
 */
export const getFieldError = (errors, fieldName) => {
    return errors?.[fieldName] || null;
};
