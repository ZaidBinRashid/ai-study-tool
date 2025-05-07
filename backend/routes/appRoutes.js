const express = require('express');
const router = express.Router();
const controller = require('../controllers/appController');
const { authenticateToken } = require('../middlewares/auth');

router.get('/', controller.homePage);

// Sign-up routes
router.get('/signup', controller.signUpGet);
router.post('/signup', controller.signUpPost);

// login routes
router.get('/login', controller.logInGet);
router.post('/login', controller.logInPost);

router.get('/app', authenticateToken, controller.appGet);

module.exports = router;