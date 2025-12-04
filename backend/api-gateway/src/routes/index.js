/**
 * Routes Index
 */

const proxyRoutes = require('./proxy.routes');
const healthRoutes = require('./health.routes');

module.exports = {
  proxyRoutes,
  healthRoutes
};
