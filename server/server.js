const express = require("express");
const app = express();
const port = 8000;
// const cors = require('cors');
require('./config/mongoose.config');
app.use( express.json() );
app.use( express.urlencoded({ extended: true}));

const UserRoutes = require('./routes/user.routes')
UserRoutes(app)

app.listen( port, () => console.log(`Listening on port: ${port}`));