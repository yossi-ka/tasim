const express = require('express');
const fs = require('fs');
const path = require('path');

// Load configuration from JSON file with error handling
const configPath = path.join(__dirname, 'config.json');
if (!fs.existsSync(configPath)) {
  console.error('❌ ERROR: config.json file not found!');
  console.error('📁 Expected location:', configPath);
  console.error('💡 Please create config.json file with the following structure:');
  console.error(JSON.stringify({
    "FUNCTIONS_BASE_URL": "XXXX",
    "PORT": 5800
  }, null, 2));
  process.exit(1);
}

let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log('🔧 Server configuration loaded successfully');
  
  // Validate required fields
  if (!config.FUNCTIONS_BASE_URL || !config.PORT) {
    console.error('❌ ERROR: Required configuration fields are missing in config.json');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ ERROR: Failed to parse config.json:', error.message);
  process.exit(1);
}

const { fetchAndNormalizeOrders } = require('./fetchAndNormalizeOrders');

const app = express();
const port = config.PORT;

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
  res.json({ status: 'ok', version: '1.0.4' });
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
