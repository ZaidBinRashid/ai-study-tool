const express = require('express');
const router = express.Router();
const controller = require('../controllers/appController');

router.get('/', controller.homePage);

// Sign-up routes
router.get('/sign-up', controller.signUpGet);
router.post('/sign-up', controller.signUpPost);


module.exports = router;