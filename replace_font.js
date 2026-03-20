const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/font-size:\s*(20|22|24)px/g, 'font-size: 19px');
fs.writeFileSync('index.html', html);
console.log('Font sizes updated.');
