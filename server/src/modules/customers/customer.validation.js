import { z } from 'zod';
import { addressObjectSchema, addressSchema, objectId } from '../../validators/common.js';

const contactSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  mobile: z.string().optional(),
  designation: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

const documentSchema = z.object({
  type: z.string().optional(),
  name: z.string().optional(),
  fileUrl: z.string().url().or(z.string().min(1)),
});

export const createCustomerSchema = z.object({
  type: z.enum(['INDIVIDUAL', 'COMPANY']).default('COMPANY'),
  source: z.enum(['ONLINE', 'OFFLINE', 'ADMIN', 'IMPORTED']).default('ADMIN'),
  name: z.string().min(2).max(200),
  company: z.string().max(200).optional().default(''),
  email: z.string().email().toLowerCase().optional().or(z.literal('')),
  mobile: z.string().min(7).max(20).optional().or(z.literal('')),
  contacts: z.array(contactSchema).optional(),
  gstin: z.string().max(20).optional().or(z.literal('')),
  pan: z.string().max(20).optional().or(z.literal('')),
  addresses: z
    .array(
      addressObjectSchema.extend({
        label: z.string().optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .optional(),
  address: addressObjectSchema
    .extend({
      pincode: z.string().optional(),
    })
    .optional(),
  alternateMobile: z.string().optional().or(z.literal('')),
  billingAddress: addressSchema,
  shippingAddress: addressSchema,
  paymentTerms: z.string().optional().default('NET_30'),
  creditLimit: z.coerce.number().min(0).optional().default(0),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).optional().default('ACTIVE'),
  notes: z.string().optional().default(''),
  tags: z.array(z.string()).optional(),
  documents: z.array(documentSchema).optional(),
  branchId: objectId.optional().or(z.literal('')),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const invitePortalSchema = z.object({
  email: z.string().email().toLowerCase(),
  name: z.string().min(2).optional(),
  password: z.string().min(8).optional(),
});

export const customerNoteSchema = z.object({
  body: z.string().min(2).max(2000),
});

export const customerTagsSchema = z.object({
  tags: z.array(z.string().min(1).max(40)).max(30),
});
