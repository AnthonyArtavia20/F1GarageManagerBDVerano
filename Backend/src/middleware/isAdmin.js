module.exports = (req, res, next) => {
  const user = req.user || req.session?.user;
  
  console.log('[isAdmin] Checking user:', {
    hasUser: !!user,
    role: user?.role,
    roleUpper: user?.role?.toUpperCase()
  });
  
  if (!user) {
    console.log('[isAdmin] ❌ No user found');
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  const isAdmin = user.role?.toUpperCase() === 'ADMIN';
  
  if (!isAdmin) {
    console.log(`[isAdmin] ❌ User role is '${user.role}', not ADMIN`);
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  console.log('[isAdmin] ✅ User is admin');
  next();
};
