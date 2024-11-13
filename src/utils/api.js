export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const getConfig = () => {
  const token = localStorage.getItem('token');
  const baseUrl = localStorage.getItem('baseUrl');
                 
  if (!token) {
    throw new ApiError('No JWT token found. Please configure in settings.', 401);
  }

  if (!baseUrl) {
    throw new ApiError('No API URL configured. Please configure in settings.', 500);
  }

  return {
    baseUrl,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/ld+json'
    }
  };
};

export const getLogisticsObjects = async (type = '') => {
  const config = getConfig();

  const response = await fetch(`${config.baseUrl}/logistics-objects/internal/_all?limit=2000&offset=0&t=${type}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/ld+json'
    }
  });

  if (!response.ok) {
    throw new ApiError('Failed to fetch logistics objects', response.status);
  }

  return response.json();
};

export const apiCall = async (endpoint, options = {}) => {
  const config = getConfig();

  const response = await fetch(`${config.baseUrl}${endpoint}`, {
    ...options,
    headers: {
      ...config.headers,
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new ApiError('API request failed', response.status);
  }

  // Don't try to parse JSON for PATCH requests or 204 responses
  if (options.method === 'PATCH' || response.status === 204 || response.status === 201) {
    return response;
  }

  return response.json();
};

export const getLogisticsObjectWithRevision = async (objectId) => {
  const config = getConfig();

  const response = await fetch(`${config.baseUrl}/logistics-objects/${objectId}`, {
    method: 'GET',
    headers: {
      ...config.headers,
      'Accept': 'application/ld+json'
    }
  });

  if (!response.ok) {
    throw new ApiError('Failed to fetch logistics object', response.status);
  }

  const latestRevision = response.headers.get('Latest-Revision');
  const data = await response.json();

  return {
    data,
    revision: latestRevision ? parseInt(latestRevision, 10) : 0
  };
};

export const submitChangeRequest = async (objectId, objectType, operations, revision) => {
  const config = getConfig();

  const changeRequest = {
    "@context": {
      "cargo": "https://onerecord.iata.org/ns/cargo#",
      "api": "https://onerecord.iata.org/ns/api#"
    },
    "@type": "api:Change",
    "api:hasLogisticsObject": {
      "@id": objectId
    },
    "api:hasDescription": `Update ${objectType}`,
    "api:hasOperation": operations,
    "api:hasRevision": {
      "@type": "http://www.w3.org/2001/XMLSchema#positiveInteger",
      "@value": (revision + 1).toString()
    }
  };

  const response = await fetch(`${config.baseUrl}/change-requests`, {
    method: 'POST',
    headers: {
      ...config.headers,
      'Content-Type': 'application/ld+json'
    },
    body: JSON.stringify(changeRequest)
  });

  if (!response.ok) {
    throw new ApiError('Failed to submit change request', response.status);
  }

  return response;
};

export const externalApiCall = async (baseUrl, endpoint, options = {}) => {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/ld+json',
      'Authorization': `Bearer ${options.server?.token}`,
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new ApiError('API request failed', response.status);
  }

  // Don't try to parse JSON for PATCH requests or 204 responses
  if (options.method === 'PATCH' || response.status === 204 || response.status === 201) {
    return response;
  }

  return response.json();
};
