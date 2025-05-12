import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface ValidationError {
  field: string;
  message: string;
}

// Validation helper function for form fields
export const validateJobForm = (formData: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Required basic fields
  if (!formData.title && !formData.contractNumber) {
    errors.push({ field: 'title', message: 'Job title or contract number is required' });
  }
  
  // Customer validation
  if (!formData.customerName) {
    errors.push({ field: 'customerName', message: 'Customer name is required' });
  }
  
  // Location validation
  if (!formData.location_id) {
    errors.push({ field: 'location_id', message: 'A valid location must be selected' });
  }
  
  // Parts validation - at least one part should be defined with a part number
  if (!formData.parts || formData.parts.length === 0 || !formData.parts[0].partNumber) {
    errors.push({ field: 'parts', message: 'At least one part number is required' });
  }
  
  // Safety requirements - at least one should be checked
  if (!formData.safetyRequirements || !formData.safetyRequirements.some((req: any) => req.checked)) {
    errors.push({ field: 'safetyRequirements', message: 'At least one safety requirement must be selected' });
  }
  
  // Inspector assignment
  if (!formData.inspectorIds || formData.inspectorIds.length === 0) {
    errors.push({ field: 'inspectorIds', message: 'At least one inspector must be assigned' });
  }
  
  // Hours validation
  if (!formData.estimatedHours && !formData.quotedHours) {
    errors.push({ field: 'quotedHours', message: 'Quoted hours are required' });
  }
  
  // Job type validation
  if (!formData.jobType) {
    errors.push({ field: 'jobType', message: 'Job type is required' });
  }
  
  // Start date validation
  if (!formData.startDate && !formData.serviceStartDate) {
    errors.push({ field: 'startDate', message: 'Start date is required' });
  }
  
  return errors;
};

// Component to display validation errors
export const ValidationSummary: React.FC<{ errors: ValidationError[] }> = ({ errors }) => {
  if (errors.length === 0) return null;
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
        <div>
          <h3 className="text-sm font-medium text-red-800">
            Please fix the following errors before submitting:
          </h3>
          <ul className="mt-2 text-sm text-red-700 list-disc pl-5">
            {errors.map((error, index) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Component to display field-level validation error
export const FieldError: React.FC<{ message?: string }> = ({ message }) => {
  if (!message) return null;
  
  return (
    <p className="text-sm text-red-600 mt-1 flex items-center">
      <AlertCircle className="h-3 w-3 mr-1" />
      {message}
    </p>
  );
};

// Helper to get field error message from errors array
export const getFieldError = (field: string, errors: ValidationError[]): string | undefined => {
  const error = errors.find(err => err.field === field);
  return error?.message;
}; 