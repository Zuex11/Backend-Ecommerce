const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const catchAsync = require('../utilities/catchAsync.util')

const token = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      isBlocked: user.isBlocked,
      gender: user.gender,
    },
    process.env.SECRET_KEY,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' },
  );
};
exports.login = catchAsync( async (req, res) => {
  const { email, password } = req.body;
  const myUser = await User.findOne({ email });

  if (!myUser || !(await myUser.isCorrectPassword(password))) {
    return res.status(401).json({
      error: 'Invalid email or password',
    });
  }
  const accessToken = token(myUser);
  res.status(200).json({ message: 'Logged in successfully', token: accessToken });
});
