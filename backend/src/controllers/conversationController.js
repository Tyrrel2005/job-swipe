const mongoose = require('mongoose');
const { Conversation, Match, Message } = require('../models');

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

module.exports = { listConversations, listMessages, sendMessage };