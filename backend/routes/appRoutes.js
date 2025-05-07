import express from 'express';
import { homePage, signUpGet, signUpPost, logInGet, logInPost, appGet } from '../controllers/appController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', homePage);

// Sign-up routes
router.get('/signup', signUpGet);
router.post('/signup', signUpPost);

// login routes
router.get('/login', logInGet);
router.post('/login', logInPost);

router.get('/app', authenticateToken, appGet);

export default router;