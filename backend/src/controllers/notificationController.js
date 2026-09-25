const mongoose = require('mongoose');
const { Notification } = require('../models');

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function listNotifications(request, response) {
  try {
    const limit = Math.min(Math.max(Number.parseInt(request.query.limit, 10) || 20, 1), 100);
    const filter = { recipientId: request.user._id };

    if (request.query.unreadOnly === 'true') {
      filter.readAt = null;
    }

    const notifications = await Notification.find(filter)
      .populate('actorId', 'email role')
      .sort({ createdAt: -1 })
      .limit(limit);

    return response.status(200).json({ notifications });
  } catch (error) {
    return response.status(500).json({
      message: 'Erreur lors de la récupération des notifications.',
      error: error.message,
    });
  }
}

async function markNotificationAsRead(request, response) {
  try {
    if (!isValidId(request.params.id)) {
      return response.status(400).json({ message: 'Identifiant de notification invalide.' });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: request.params.id, recipientId: request.user._id },
      { readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return response.status(404).json({ message: 'Notification introuvable.' });
    }

    return response.status(200).json({ notification });
  } catch (error) {
    return response.status(500).json({
      message: 'Erreur lors du marquage de la notification.',
      error: error.message,
    });
  }
}

async function markAllNotificationsAsRead(request, response) {
  try {
    const result = await Notification.updateMany(
      { recipientId: request.user._id, readAt: null },
      { readAt: new Date() }
    );

    return response.status(200).json({
      message: 'Notifications marquées comme lues.',
      markedCount: result.modifiedCount,
    });
  } catch (error) {
    return response.status(500).json({
      message: 'Erreur lors du marquage des notifications.',
      error: error.message,
    });
  }
}

module.exports = {
  listNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};