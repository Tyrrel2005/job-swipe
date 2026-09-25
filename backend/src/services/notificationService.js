const { Notification } = require('../models');

async function createNotification({
  recipientId,
  actorId,
  type,
  title,
  message,
  data,
  io,
}) {
  const notification = await Notification.create({
    recipientId,
    actorId,
    type,
    title,
    message,
    data: data || {},
  });

  await notification.populate('actorId', 'email role');

  if (io) {
    io.to(`user:${recipientId}`).emit('notification:new', notification);
  }

  return notification;
}

module.exports = { createNotification };