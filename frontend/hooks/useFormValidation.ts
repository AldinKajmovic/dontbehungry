'use client';

import { useState, useCallback } from 'react';
import { CountryCode } from 'libphonenumber-js';
import { validateFieldValue } from '@/services/validation';

type FormErrors<T> = Partial<Record<keyof T, string>>;

interface UseFormValidationOptions<T> {
  initialValues: T;
  phoneFields?: { field: keyof T; countryState: () => CountryCode }[];
}

export function useFormValidation<T extends Record<string, string | undefined>>({
  initialValues,
  phoneFields = [],
}: UseFormValidationOptions<T>) {
  const [formData, setFormData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touchedFields, setTouchedFields] = useState<Set<keyof T>>(new Set());

  const validateField = useCallback(
    (fieldName: keyof T, value?: string): boolean => {
      const fieldValue = value ?? formData[fieldName] ?? '';
      const phoneField = phoneFields.find(p => p.field === fieldName);

      const error = validateFieldValue(fieldName as string, fieldValue, {
        password: formData.password as string,
        phoneCountry: phoneField?.countryState(),
      });

      setErrors(prev => ({ ...prev, [fieldName]: error }));
      return !error;
    },
    [formData, phoneFields]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));

      if (touchedFields.has(name as keyof T)) {
        validateField(name as keyof T, value);
      }
    },
    [touchedFields, validateField]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name } = e.target;
      setTouchedFields(prev => new Set(prev).add(name as keyof T));
      validateField(name as keyof T);
    },
    [validateField]
  );

  const setFieldValue = useCallback((name: keyof T, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const setFieldTouched = useCallback((name: keyof T) => {
    setTouchedFields(prev => new Set(prev).add(name));
  }, []);

  const validateFields = useCallback(
    (fields: (keyof T)[]): boolean => {
      let isValid = true;
      fields.forEach(field => {
        setTouchedFields(prev => new Set(prev).add(field));
        if (!validateField(field)) {
          isValid = false;
        }
      });
      return isValid;
    },
    [validateField]
  );

  const markAllTouched = useCallback((fields: (keyof T)[]) => {
    setTouchedFields(new Set(fields));
  }, []);

  const getFieldError = useCallback(
    (field: keyof T): string | undefined => {
      return touchedFields.has(field) ? errors[field] : undefined;
    },
    [errors, touchedFields]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    formData,
    errors,
    touchedFields,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldTouched,
    validateField,
    validateFields,
    markAllTouched,
    getFieldError,
    clearErrors,
    setErrors,
  };
}
