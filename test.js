const fs = require('fs');
const dataPath = `${process.env.HOME}/.mm/data.json`;
fs.writeFileSync(dataPath, 'hallo');