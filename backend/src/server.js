require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const { connectDatabase } = require('./config/db');
const { registerSocketHandlers } = require('./sockets/socket');

const port = process.env.PORT || 3000;
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

connectDatabase();
registerSocketHandlers(io);

httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});