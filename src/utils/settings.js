export const getServers = () => {
  const savedServers = localStorage.getItem('externalServers');
  return savedServers ? JSON.parse(savedServers) : [];
};
