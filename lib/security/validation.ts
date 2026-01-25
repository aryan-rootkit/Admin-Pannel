/**
 * Input Validation Schemas
 * Prevents NoSQL injection, XSS, and invalid data
 */

import { z } from 'zod';

// Client Validation Schema
export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  phone: z.string().max(20, 'Phone number too long').optional().or(z.literal('')),
  company: z.string().max(100, 'Company name too long').optional().or(z.literal('')),
  address: z.string().max(500, 'Address too long').optional().or(z.literal('')),
  status: z.enum(['Lead', 'Active', 'Inactive', 'Archived']).optional(),
  notes: z.string().max(2000, 'Notes too long').optional().or(z.literal('')),
  totalRevenue: z.number().min(0).optional(),
  assignedDevelopers: z.array(z.string()).optional(),
});

// Team Member Validation Schema
export const teamSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  contact: z.string().max(20, 'Contact too long').optional().or(z.literal('')),
  employmentType: z.enum(['In-House', 'Contractor']).optional(),
  role: z.enum(['Developer', 'UI-UX', 'Marketing', 'Sales', 'BD']).optional(),
  subRole: z.string().max(50, 'Sub-role too long').optional().or(z.literal('')),
  skills: z.array(z.string().max(50)).optional(),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive').max(100000, 'Hourly rate too high'),
  hoursWorkedThisWeek: z.number().min(0).max(168, 'Invalid hours').optional(),
  avatar: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
  assignedProjects: z.array(z.string()).optional(),
});

// Project Validation Schema
export const projectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long').trim(),
  description: z.string().min(1, 'Description is required').max(5000, 'Description too long').trim(),
  client: z.string().min(1, 'Client is required').max(100, 'Client name too long').trim(),
  developers: z.array(z.string()).min(1, 'At least one developer is required'),
  projectType: z.string().min(1, 'Project type is required').max(100).trim(),
  subType: z.string().max(100).optional().or(z.literal('')),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  budget: z.number().min(0, 'Budget must be positive').max(1000000000, 'Budget too high'),
  status: z.enum(['Pending', 'In Progress', 'Review', 'Completed', 'Delayed', 'Overdue']),
  priority: z.enum(['High', 'Medium', 'Low']).optional(),
  tags: z.array(z.string().max(50)).optional(),
  revenueLink: z.string().url('Invalid URL').optional().or(z.literal('')),
  progressPercent: z.number().min(0).max(100).optional(),
  assignedTeam: z.array(z.string()).optional(),
});

// Revenue Validation Schema
export const revenueSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().min(0, 'Amount must be positive').max(1000000000, 'Amount too high'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long').trim(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  project: z.string().optional(),
  status: z.enum(['pending', 'paid', 'overdue']).optional(),
  invoiceNumber: z.string().max(100).optional().or(z.literal('')),
});

// Event Validation Schema
export const eventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').trim(),
  description: z.string().max(2000, 'Description too long').optional().or(z.literal('')),
  start: z.string().datetime({ message: 'Invalid start date' }),
  end: z.string().datetime({ message: 'Invalid end date' }),
  type: z.enum(['event', 'deadline', 'meeting', 'reminder']).optional(),
  project: z.string().optional(),
  assignedTo: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
});

// MongoDB ObjectId Validation
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

// Sanitize string input (remove dangerous characters)
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// Validate and sanitize MongoDB query
export function sanitizeMongoQuery(query: any): any {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(query)) {
    // Prevent NoSQL injection by removing dangerous operators
    if (typeof key === 'string' && (key.startsWith('$') || key.includes('__'))) {
      continue; // Skip dangerous keys
    }
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeMongoQuery(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}
