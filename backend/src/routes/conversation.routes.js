const express = require('express');

const {
  getUnreadCount,
  listConversations,
  listMessages,
  markConversationAsRead,
  sendMessage,
} = require('../controllers/conversationController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', listConversations);
router.get('/:id/unread', getUnreadCount);
router.patch('/:id/read', markConversationAsRead);
router.get('/:id/messages', listMessages);
router.post('/:id/messages', sendMessage);

module.exports = router;