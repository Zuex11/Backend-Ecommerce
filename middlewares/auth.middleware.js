const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
exports.authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const myUser = await User.findById(decoded.id).select('-password');
    if (!myUser) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (myUser.isBlocked) {
      return res.status(401).json({ error: 'You are blocked from the system' });
    }
    if (myUser.isDeleted) {
      return res.status(401).json({ error: 'Account no longer exists' });
    }
    req.user = myUser;
    return next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return next(err);
  }
};
