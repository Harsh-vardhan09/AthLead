import express from 'express'
import mongoose from "mongoose";
import 'dotenv/config';
import cors from 'cors'
import { getNews } from './controllers/newsController.js';
import db from './config/db.js';
import { editUser, getUser, LoginAuth, refesh, SingupAuth } from './controllers/authController.js';
import passport from 'passport';
import cookieParser from 'cookie-parser'
import userRouter from './routes/userRoutes.js'
import { findAllEvent, registerEvent } from './controllers/eventController.js';
import multer from 'multer'
import path from 'path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

// Get current file path (replaces __filename)
const __filename = fileURLToPath(import.meta.url);

// Get current directory path (replaces __dirname)
const __dirname = dirname(__filename);

db()



const app=express();
app.use(cookieParser())
app.use(cors({
    origin:process.env.FRONTEND_URL,
    credentials:true
}));

app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(passport.initialize());

const frontendPath = path.resolve(__dirname, ".././Athlead-client/dist");
app.use(express.static(frontendPath));


import './config/passport-config.js'
import { requireAuth } from './middleware/middleware.js';
import { getRanking, getScore, setScore } from './controllers/scoreController.js';

const upload = multer({ dest: 'uploads/' })



app.use('/api/auth',userRouter)

app.get('/api/news',getNews);
app.post('/api/refresh',refesh);

app.get('/api/events',findAllEvent)
app.post('/api/events/:eventId/register',passport.authenticate('jwt',{session:false}),registerEvent)


app.post('/api/score',passport.authenticate('jwt',{session:false}),setScore)
app.get('/api/my-scores',passport.authenticate('jwt',{session:false}),getScore)

app.patch('/api/edit',passport.authenticate('jwt',{session:false}), upload.single('profile_picture'),editUser)
app.get('/api/user/me',passport.authenticate('jwt',{session:false}),getUser)
app.get('/api/score/rank',passport.authenticate('jwt',{session:false}),getRanking);

app.use((req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});


app.listen(process.env.SERVER_PORT,()=>{
    console.log(`server is running on http://localhost:${process.env.SERVER_PORT}`);
})