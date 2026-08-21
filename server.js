const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('this is a change');
 
});

app.listen(5000, () => console.log('Server running on port 5000'));