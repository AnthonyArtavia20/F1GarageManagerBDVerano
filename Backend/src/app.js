const express = require('express');
const app = express();
const PORT = 5000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/api/f1', (req, res) => {
  res.json({ proyecto: 'F1 Garage Manager', status: 'OK' });
});

app.listen(PORT, () => {
  console.log('Servidor en http://localhost:' + PORT);
});
