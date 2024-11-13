// Mock data
const mockData = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    status: 'inactive',
    createdAt: '2024-01-16T11:30:00Z'
  },
  // Add more mock data as needed
];

export const fetchTableData = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate API response
  return mockData;
};
