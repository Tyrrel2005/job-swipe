const mongoose = require('mongoose');
const { Conversation, Match, Message } = require('../models');
const { createNotification } = require('../services/notificationService');

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function findAccessibleConversation(conversationId, userId) {
  return Conversation.findOne({
    _id: conversationId,
    participantIds: userId,
  });
}

async function listConversations(request, response) {
  try {
    const conversations = await Conversation.find({ participantIds: request.user._id })
      .populate('matchId')
      .populate('participantIds', 'email role candidateProfile recruiterProfile')
      .sort({ lastMessageAt: -1 });

    return response.status(200).json({ conversations });
  } catch (error) {
    return response.status(500).json({
      message: 'Erreur lors de la récupération des conversations.',
      error: error.message,
    });
  }
}

async function listMessages(request, response) {
  try {
    if (!isValidId(request.params.id)) {
      return response.status(400).json({ message: 'Identifiant de conversation invalide.' });
    }

    const conversation = await findAccessibleConversation(request.params.id, request.user._id);

    if (!conversation) {
      return response.status(404).json({ message: 'Conversation introuvable.' });
    }

    const messages = await Message.find({ conversationId: conversation._id })
      .populate('senderId', 'email role')
      .sort({ createdAt: 1 });

    return response.status(200).json({ conversation, messages });
  } catch (error) {
    return response.status(500).json({
      message: 'Erreur lors de la récupération des messages.',
      error: error.message,
    });
  }
}

async function getUnreadCount(request, response) {
  try {
    if (!isValidId(request.params.id)) {
      return response.status(400).json({ message: 'Identifiant de conversation invalide.' });
    }

    const conversation = await findAccessibleConversation(request.params.id, request.user._id);

    if (!conversation) {
      return response.status(404).json({ message: 'Conversation introuvable.' });
    }

    const unreadCount = await Message.countDocuments({
      conversationId: conversation._id,
      senderId: { $ne: request.user._id },
      readBy: { $ne: request.user._id },
    });

    return response.status(200).json({ conversationId: conversation._id, unreadCount });
  } catch (error) {
    return response.status(500).json({
      message: 'Erreur lors du comptage des messages non lus.',
      error: error.message,
    });
  }
}

async function markConversationAsRead(request, response) {
  try {
    if (!isValidId(request.params.id)) {
      return response.status(400).json({ message: 'Identifiant de conversation invalide.' });
    }

    const conversation = await findAccessibleConversation(request.params.id, request.user._id);

    if (!conversation) {
      return response.status(404).json({ message: 'Conversation introuvable.' });
    }

    const result = await Message.updateMany(
      {
        conversationId: conversation._id,
        senderId: { $ne: request.user._id },
        readBy: { $ne: request.user._id },
      },
      { $addToSet: { readBy: request.user._id } }
    );

    return response.status(200).json({
      message: 'Conversation marquée comme lue.',
      conversationId: conversation._id,
      markedCount: result.modifiedCount,
    });
  } catch (error) {
    return response.status(500).json({
      message: 'Erreur lors du marquage de la conversation.',
      error: error.message,
    });
  }
}

async function sendMessage(request, response) {
  try {
    if (!isValidId(request.params.id)) {
      return response.status(400).json({ message: 'Identifiant de conversation invalide.' });
    }

    const conversation = await findAccessibleConversation(request.params.id, request.user._id);

    if (!conversation) {
      return response.status(404).json({ message: 'Conversation introuvable.' });
    }

    const content = typeof request.body?.content === 'string'
      ? request.body.content.trim()
      : '';

    if (!content) {
      return response.status(400).json({ message: 'Le contenu du message est requis.' });
    }

    if (content.length > 5000) {
      return response.status(400).json({ message: 'Le message ne doit pas dépasser 5000 caractères.' });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: request.user._id,
      senderRole: request.user.role,
      content,
    });

    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    const recipientId = conversation.participantIds.find(
      (participantId) => participantId.toString() !== request.user._id.toString()
    );

    await createNotification({
      recipientId,
      actorId: request.user._id,
      type: 'new_message',
      title: 'Nouveau message',
      message: 'Vous avez reçu un nouveau message.',
      data: { conversationId: conversation._id, messageId: message._id },
      io: request.app.get('io'),
    });

    return response.status(201).json({
      message: 'Message envoyé avec succès.',
      data: message,
    });
  } catch (error) {
    return response.status(500).json({
      message: "Erreur lors de l'envoi du message.",
      error: error.message,
    });
  }
}

module.exports = {
  listConversations,
  listMessages,
  getUnreadCount,
  markConversationAsRead,
  sendMessage,
};