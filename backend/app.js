const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const appRoutes = require('./routes/appRoutes');

require('dotenv').config();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.resolve('./views'));

app.use('/', appRoutes);

module.exports = app;
