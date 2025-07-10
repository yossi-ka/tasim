const express = require('express');
const { fetchAndNormalizeOrders } = require('./fetchAndNormalizeOrders');

const app = express();
const port = process.env.PORT || 5800;

//need to parse JSON bodies
app.use(express.json());
// Middleware to handle CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Allow all origins
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Allow specific methods
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Allow specific headers
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204); // Respond to preflight requests
  }
  next();
});

app.get('/test', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/fetch-and-normalize', async (req, res) => {
  try {
    const data = await fetchAndNormalizeOrders();
    res.json({ success: true, orders: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(port, () => {
  console.log(`NBS API Server listening at http://localhost:${port}`);
});
