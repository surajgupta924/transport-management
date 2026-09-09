import { z } from 'zod';
import { addressSchema, objectId } from '../../validators/common.js';

export const createDriverSchema = z.object({
  employeeId: z.string().optional(),
  name: z.string().min(2).max(120),
  mobile: z.string().min(7).max(20),
  email: z.string().email().toLowerCase().optional().or(z.literal('')),
  licenseNumber: z.string().min(5).max(40),
  licenseType: z.string().optional(),
  licenseExpiry: z.coerce.date().optional(),
  dateOfBirth: z.coerce.date().optional(),
  joiningDate: z.coerce.date().optional(),
  salary: z
    .object({
      basic: z.number().min(0).optional(),
      allowance: z.number().min(0).optional(),
      currency: z.string().optional(),
    })
    .optional(),
  address: addressSchema,
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'ON_LEAVE', 'INACTIVE']).optional().default('AVAILABLE'),
  userId: objectId.optional().or(z.literal('')),
  branchId: objectId.optional().or(z.literal('')),
  emergencyContact: z
    .object({
      name: z.string().optional(),
      mobile: z.string().optional(),
      relation: z.string().optional(),
    })
    .optional(),
  notes: z.string().optional(),
});

export const updateDriverSchema = createDriverSchema.partial();

export const driverDocumentSchema = z.object({
  type: z.enum(['LICENSE', 'AADHAR', 'PAN', 'MEDICAL', 'POLICE_VERIFICATION', 'OTHER']),
  number: z.string().optional(),
  issuedAt: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  fileUrl: z.string().optional(),
  notes: z.string().optional(),
});
