import express from 'express';
import { homePage, signUpGet, signUpPost, logInGet, logInPost, appGet, logOut } from '../controllers/userController.js';
import { uploadPdfHandler, extractTextFromPdfHandler } from '../controllers/pdfController.js';
import { authenticateToken} from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

router.get('/', homePage);

// Sign-up routes
router.get('/signup', signUpGet);
router.post('/signup', signUpPost);

// login routes
router.get('/login', logInGet);
router.post('/login', logInPost);

// logout route
router.get('/logout', logOut); 

// App routes
router.get('/app', authenticateToken, appGet);
router.post('/upload', authenticateToken, upload.single("pdf"), uploadPdfHandler, extractTextFromPdfHandler);


export default router;