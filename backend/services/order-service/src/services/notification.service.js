/**
 * Notification Service
 * Handles sending order-related notifications
 */

const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Send email helper
 */
async function sendEmail(to, subject, html) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'E-Store <noreply@estore.com>',
      to,
      subject,
      html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw - email failures shouldn't break the order flow
    return null;
  }
}

/**
 * Generate order items HTML
 */
function generateOrderItemsHtml(items) {
  return items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover;">` : ''}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');
}

/**
 * Send order confirmation email
 */
async function sendOrderConfirmation(order, email) {
  const subject = `Order Confirmation - ${order.orderNumber}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Order Confirmed!</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p>Thank you for your order!</p>
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
        
        <h3>Order Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #eee;">
              <th style="padding: 10px; text-align: left;"></th>
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
              <th style="padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${generateOrderItemsHtml(order.items)}
          </tbody>
        </table>
        
        <div style="margin-top: 20px; text-align: right;">
          <p><strong>Subtotal:</strong> $${order.pricing.subtotal.toFixed(2)}</p>
          <p><strong>Shipping:</strong> $${order.pricing.shipping.toFixed(2)}</p>
          <p><strong>Tax:</strong> $${order.pricing.tax.toFixed(2)}</p>
          ${order.pricing.discount > 0 ? `<p><strong>Discount:</strong> -$${order.pricing.discount.toFixed(2)}</p>` : ''}
          <p style="font-size: 1.2em;"><strong>Total:</strong> $${order.pricing.total.toFixed(2)}</p>
        </div>
        
        <h3>Shipping Address</h3>
        <p>
          ${order.shippingAddress.fullName}<br>
          ${order.shippingAddress.street}<br>
          ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
          ${order.shippingAddress.country}
        </p>
        
        <p style="margin-top: 30px; text-align: center;">
          <a href="${process.env.FRONTEND_URL}/orders/${order._id}" 
             style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            View Order
          </a>
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
        <p>If you have any questions, please contact our support team.</p>
        <p>© ${new Date().getFullYear()} E-Store. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail(email, subject, html);
}

/**
 * Send order status update email
 */
async function sendOrderStatusUpdate(order, email) {
  const statusMessages = {
    confirmed: 'Your order has been confirmed and is being processed.',
    processing: 'Your order is being prepared for shipment.',
    shipped: 'Great news! Your order has been shipped.',
    delivered: 'Your order has been delivered.',
    cancelled: 'Your order has been cancelled.',
    returned: 'Your return has been processed.'
  };

  const subject = `Order Update - ${order.orderNumber}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Update</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #2196F3; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Order Update</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Status:</strong> <span style="text-transform: capitalize; color: #2196F3;">${order.status}</span></p>
        
        <p style="font-size: 1.1em; margin: 20px 0; padding: 15px; background-color: #e3f2fd; border-radius: 4px;">
          ${statusMessages[order.status] || `Your order status has been updated to: ${order.status}`}
        </p>
        
        ${order.shipping?.trackingNumber ? `
          <div style="margin: 20px 0; padding: 15px; background-color: #fff; border: 1px solid #ddd; border-radius: 4px;">
            <h3 style="margin-top: 0;">Shipping Information</h3>
            <p><strong>Carrier:</strong> ${order.shipping.carrier || 'Standard Shipping'}</p>
            <p><strong>Tracking Number:</strong> ${order.shipping.trackingNumber}</p>
          </div>
        ` : ''}
        
        <p style="margin-top: 30px; text-align: center;">
          <a href="${process.env.FRONTEND_URL}/orders/${order._id}" 
             style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            View Order Details
          </a>
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
        <p>© ${new Date().getFullYear()} E-Store. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail(email, subject, html);
}

/**
 * Send order cancellation email
 */
async function sendOrderCancellation(order, email) {
  const subject = `Order Cancelled - ${order.orderNumber}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Cancelled</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f44336; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Order Cancelled</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p>Your order <strong>${order.orderNumber}</strong> has been cancelled.</p>
        
        ${order.payment?.status === 'refunded' ? `
          <p style="padding: 15px; background-color: #e8f5e9; border-radius: 4px;">
            <strong>Refund Status:</strong> A refund has been initiated. 
            Please allow 5-10 business days for the refund to appear in your account.
          </p>
        ` : ''}
        
        <h3>Cancelled Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #eee;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <p style="margin-top: 30px;">
          If you have any questions about this cancellation, please contact our support team.
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
        <p>© ${new Date().getFullYear()} E-Store. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail(email, subject, html);
}

/**
 * Send payment confirmation email
 */
async function sendPaymentConfirmation(order, email) {
  const subject = `Payment Received - ${order.orderNumber}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Payment Received</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p>We have received your payment for order <strong>${order.orderNumber}</strong>.</p>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #e8f5e9; border-radius: 4px;">
          <p style="margin: 0;"><strong>Amount Paid:</strong> $${order.pricing.total.toFixed(2)}</p>
          <p style="margin: 5px 0 0 0;"><strong>Payment Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p>We will begin processing your order shortly. You will receive another email when your order ships.</p>
        
        <p style="margin-top: 30px; text-align: center;">
          <a href="${process.env.FRONTEND_URL}/orders/${order._id}" 
             style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            View Order
          </a>
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
        <p>© ${new Date().getFullYear()} E-Store. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail(email, subject, html);
}

/**
 * Send payment failed email
 */
async function sendPaymentFailed(order, email) {
  const subject = `Payment Failed - ${order.orderNumber}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Failed</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #ff9800; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Payment Failed</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p>Unfortunately, we were unable to process your payment for order <strong>${order.orderNumber}</strong>.</p>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #fff3e0; border-radius: 4px;">
          <p style="margin: 0;"><strong>Order Total:</strong> $${order.pricing.total.toFixed(2)}</p>
        </div>
        
        <p>Please try again with a different payment method or contact your bank for more information.</p>
        
        <p style="margin-top: 30px; text-align: center;">
          <a href="${process.env.FRONTEND_URL}/orders/${order._id}" 
             style="background-color: #ff9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            Retry Payment
          </a>
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
        <p>If you continue to experience issues, please contact our support team.</p>
        <p>© ${new Date().getFullYear()} E-Store. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail(email, subject, html);
}

/**
 * Send refund notification email
 */
async function sendRefundNotification(order, email, amount) {
  const subject = `Refund Processed - ${order.orderNumber}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Refund Processed</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #2196F3; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Refund Processed</h1>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p>A refund has been processed for your order <strong>${order.orderNumber}</strong>.</p>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #e3f2fd; border-radius: 4px;">
          <p style="margin: 0;"><strong>Refund Amount:</strong> $${amount.toFixed(2)}</p>
          <p style="margin: 5px 0 0 0;"><strong>Original Order Total:</strong> $${order.pricing.total.toFixed(2)}</p>
        </div>
        
        <p>Please allow 5-10 business days for the refund to appear in your account, depending on your payment provider.</p>
        
        <p style="margin-top: 30px; text-align: center;">
          <a href="${process.env.FRONTEND_URL}/orders/${order._id}" 
             style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            View Order
          </a>
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
        <p>If you have any questions about this refund, please contact our support team.</p>
        <p>© ${new Date().getFullYear()} E-Store. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail(email, subject, html);
}

module.exports = {
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendOrderCancellation,
  sendPaymentConfirmation,
  sendPaymentFailed,
  sendRefundNotification
};
