export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

export const isMasterAdmin = () => {
  const user = getCurrentUser();
  return user?.role === 'MASTER_ADMIN';
};

export const isAdmin = () => {
  const user = getCurrentUser();
  return user?.role === 'ADMIN' || user?.role === 'MASTER_ADMIN';
};

export const canManageAdmins = () => {
  return isMasterAdmin();
};