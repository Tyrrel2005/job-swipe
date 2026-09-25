const express = require('express');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const jobOfferRoutes = require('./routes/jobOffer.routes');
const matchRoutes = require('./routes/match.routes');
const conversationRoutes = require('./routes/conversation.routes');

const app = express();

app.use(express.json());
app.get('/api-docs.json', (_request, response) => response.json(swaggerSpec));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobOfferRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/conversations', conversationRoutes);
app.use(healthRoutes);

module.exports = app;