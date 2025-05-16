import express from 'express';
import cors from 'cors';
import router from './routes/appRoutes.js';
import cookieParser from 'cookie-parser';
import 'dotenv/config'
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(cors(
    {
        origin: process.env.CLIENT_URL,
        credentials: true,
    }
));

app.use(express.json());
app.use(cookieParser());
app.use(express.static(join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', resolve('./views'));

app.use('/', router);
app.use("/uploads", express.static("uploads"));


export default app;
