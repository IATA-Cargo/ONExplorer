export const validateSettings = () => {
  const token = localStorage.getItem('token');
  const baseUrl = localStorage.getItem('baseUrl');
  
  const errors = [];
  
  if (!token) {
    errors.push('JWT token is not configured');
  }
  
  if (!baseUrl) {
    errors.push('API base URL is not configured');
  } else {
    try {
      new URL(baseUrl);
    } catch (e) {
      errors.push('Invalid API base URL format');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
