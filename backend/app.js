const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const appRoutes = require('./routes/appRoutes');
const cookieParser = require('cookie-parser');

require('dotenv').config();


app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.resolve('./views'));

app.use('/', appRoutes);

module.exports = app;
