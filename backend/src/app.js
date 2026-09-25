const express = require('express');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const jobOfferRoutes = require('./routes/jobOffer.routes');
const matchRoutes = require('./routes/match.routes');

const app = express();

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobOfferRoutes);
app.use('/api/matches', matchRoutes);
app.use(healthRoutes);

module.exports = app;