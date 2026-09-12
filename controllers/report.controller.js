const Order = require('../models/order.model');
const Testimonial = require('../models/testimonials.model');
const catchAsync = require('../utilities/catchAsync.util');
const logger = require('../utilities/logger.util');

exports.getDashboardReport = catchAsync(async (req, res) => {
  logger.info(`Get dashboard report by ${req.user.firstName} - id: ${req.user._id}`, {
    action: 'admin',
    user: req.user._id,
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const activeStatuses = ['pending', 'in progress', 'shipped', 'received'];

  const summary = await Order.aggregate([
    {
      $facet: {
        monthlyRevenue: [
          { $match: { orderedAt: { $gte: monthStart }, status: { $in: activeStatuses } } },
          { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        ],
        pendingOrders: [{ $match: { status: 'pending' } }, { $count: 'count' }],
        topProducts: [
          { $match: { status: { $in: activeStatuses } } },
          { $unwind: '$products' },
          {
            $lookup: {
              from: 'products',
              localField: 'products.productId',
              foreignField: '_id',
              as: 'product',
            },
          },
          { $unwind: '$product' },
          {
            $group: {
              _id: '$product._id',
              name: { $first: '$product.name' },
              sold: { $sum: '$products.quantity' },
            },
          },
          { $sort: { sold: -1 } },
          { $limit: 5 },
          { $project: { _id: 0, name: 1, sold: 1 } },
        ],
        topCustomers: [
          { $match: { status: { $in: activeStatuses } } },
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'user',
            },
          },
          { $unwind: '$user' },
          {
            $group: {
              _id: '$user._id',
              name: { $first: { $concat: ['$user.firstName', ' ', '$user.lastName'] } },
              totalSpent: { $sum: '$totalPrice' },
            },
          },
          { $sort: { totalSpent: -1 } },
          { $limit: 5 },
          { $project: { _id: 0, name: 1, totalSpent: 1 } },
        ],
      },
    },
  ]);

  const pendingTestimonials = await Testimonial.countDocuments({
    isApproved: false,
    isDeleted: false,
  });

  const report = {
    monthRevenue: summary[0].monthlyRevenue[0]?.total ?? 0,
    pendingOrders: summary[0].pendingOrders[0]?.count ?? 0,
    pendingTestimonials,
    topProducts: summary[0].topProducts,
    topCustomers: summary[0].topCustomers,
  };

  res.status(200).json({ message: 'Dashboard report', data: report });
});
