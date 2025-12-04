/**
 * Order Service Services Index
 */

const paymentService = require('./payment.service');
const notificationService = require('./notification.service');
const cartService = require('./cart.service');

module.exports = {
  paymentService,
  notificationService,
  cartService
};
