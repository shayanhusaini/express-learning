const app = require('./server/app');

// Start the server
const port = app.get('port') || 3000;
app.listen(port, () => console.log('Server is listening on port '+ port));