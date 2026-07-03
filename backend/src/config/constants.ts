/**
 * Application constants — magic numbers and defaults live here, not in business logic.
 */

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const VALIDATION = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 255,
  PHONE_MAX_LENGTH: 20,
  CGPA_MIN: 0,
  CGPA_MAX: 10,
  DESCRIPTION_MAX_LENGTH: 5000,
  SKILLS_MAX_COUNT: 50,
  CUSTOM_FIELDS_MAX_COUNT: 20,
} as const;

export const API_PREFIX = '/api/v1' as const;
