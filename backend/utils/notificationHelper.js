const Notification = require('../models/Notification');

async function createNotification({ orgId, recipientId, type, title, message, taskId, triggeredBy }) {
  try {
    if (String(recipientId) === String(triggeredBy)) return null;

    const notification = await Notification.create({
      orgId,
      recipientId,
      type,
      title,
      message,
      taskId,
      triggeredBy,
    });
    return notification;
  } catch (err) {
    console.error('Notification creation failed:', err.message);
    return null;
  }
}

module.exports = { createNotification };
