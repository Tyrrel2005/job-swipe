const mongoose = require('mongoose');
const { Conversation, Message, User } = require('../models');
const { verifyToken } = require('../utils/token');

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function getToken(socket) {
  return socket.handshake.auth?.token
    || socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');
}

async function getAcceptedConversation(conversationId, userId) {
  if (!isValidId(conversationId)) return null;

  const conversation = await Conversation.findOne({
    _id: conversationId,
    participantIds: userId,
  }).populate('matchId', 'status');

  if (!conversation || !conversation.matchId || conversation.matchId.status !== 'accepted') {
    return null;
  }

  return conversation;
}

function emitSocketError(socket, callback, message) {
  const error = { success: false, message };
  socket.emit('message:error', error);

  if (callback) callback(error);
}

function registerSocketHandlers(io) {
  io.use(async (socket, next) => {
    try {
      const token = getToken(socket);

      if (!token) {
        return next(new Error('Token manquant.'));
      }

      const payload = verifyToken(token);
      const user = await User.findById(payload.id).select('-passwordHash');

      if (!user) {
        return next(new Error('Utilisateur introuvable.'));
      }

      socket.user = user;
      return next();
    } catch (_error) {
      return next(new Error('Token invalide ou expiré.'));
    }
  });

  io.on('connection', (socket) => {
    socket.emit('socket:ready', { userId: socket.user._id });

    socket.on('conversation:join', async (payload, callback) => {
      try {
        const conversationId = payload?.conversationId;
        const conversation = await getAcceptedConversation(conversationId, socket.user._id);

        if (!conversation) {
          return emitSocketError(socket, callback, 'Conversation inaccessible.');
        }

        socket.join(`conversation:${conversation._id}`);
        return callback?.({ success: true, conversationId: conversation._id });
      } catch (_error) {
        return emitSocketError(socket, callback, 'Impossible de rejoindre la conversation.');
      }
    });

    socket.on('conversation:leave', (payload, callback) => {
      const conversationId = payload?.conversationId;

      if (!isValidId(conversationId)) {
        return emitSocketError(socket, callback, 'Identifiant de conversation invalide.');
      }

      socket.leave(`conversation:${conversationId}`);
      return callback?.({ success: true, conversationId });
    });

    socket.on('message:send', async (payload, callback) => {
      try {
        const conversationId = payload?.conversationId;
        const content = typeof payload?.content === 'string' ? payload.content.trim() : '';

        if (!content) {
          return emitSocketError(socket, callback, 'Le contenu du message est requis.');
        }

        if (content.length > 5000) {
          return emitSocketError(socket, callback, 'Le message ne doit pas dépasser 5000 caractères.');
        }

        const conversation = await getAcceptedConversation(conversationId, socket.user._id);

        if (!conversation) {
          return emitSocketError(socket, callback, 'Conversation inaccessible.');
        }

        const message = await Message.create({
          conversationId: conversation._id,
          senderId: socket.user._id,
          senderRole: socket.user.role,
          content,
        });

        conversation.lastMessageAt = message.createdAt;
        await conversation.save();
        await message.populate('senderId', 'email role');

        const room = `conversation:${conversation._id}`;
        io.to(room).emit('message:new', message);

        return callback?.({ success: true, data: message });
      } catch (_error) {
        return emitSocketError(socket, callback, "Impossible d'envoyer le message.");
      }
    });
  });
}

module.exports = { registerSocketHandlers };