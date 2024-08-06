const mongoose = require('mongoose');
require('dotenv').config();
const MOGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

console.log("MONGO_URI", MOGO_URI);
mongoose.connect(MOGO_URI, {
})
    .then(() => console.log('Established a connection to the database'))
    .catch(err => console.log('Something went wrong when connecting to the database ', err));

