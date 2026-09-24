require('dotenv').config();

const app = require('./app');
const { connectDatabase } = require('./config/db');

const port = process.env.PORT || 3000;

connectDatabase();

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});