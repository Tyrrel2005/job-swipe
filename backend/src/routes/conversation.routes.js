const express = require('express');

const {
  getUnreadCount,
  clearMessages,
  ensureConversationForMatch,
  listConversations,
  listMessages,
  markConversationAsRead,
  sendMessage,
} = require('../controllers/conversationController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', listConversations);
router.post('/matches/:matchId', ensureConversationForMatch);
router.get('/:id/unread', getUnreadCount);
router.patch('/:id/read', markConversationAsRead);
router.get('/:id/messages', listMessages);
router.post('/:id/messages', sendMessage);
router.delete('/:id/messages', clearMessages);

module.exports = router;