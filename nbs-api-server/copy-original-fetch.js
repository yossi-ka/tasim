// This script copies the original fetchAndNormalizeOrders.js from the main project to this server folder
const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../functions/nbs-api/fetchAndNormalizeOrders.js');
const dest = path.resolve(__dirname, './fetchAndNormalizeOrders.js');

fs.copyFileSync(src, dest);
console.log('Copied fetchAndNormalizeOrders.js to server folder.');
