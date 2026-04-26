import express from 'express'
import mongoose from "mongoose";
import 'dotenv/config';
import cors from 'cors'
import { getNews } from './controllers/newsController.js';
import db from './config/db.js';
import { LoginAuth, refesh, SingupAuth } from './controllers/authController.js';
import passport from 'passport';
import cookieParser from 'cookie-parser'
import userRouter from './routes/userRoutes.js'
import { findAllEvent } from './controllers/eventController.js';


db()


const app=express();
app.use(cors({
    origin:process.env.FRONTEND_URL,
    credentials:true
}));
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(passport.initialize());
app.use(cookieParser())

import './config/passport-config.js'
import { requireAuth } from './middleware/middleware.js';




app.use('/api/auth',userRouter)

app.get('/api/news',getNews);
app.post('/api/refresh',refesh);

app.get('/api/events',findAllEvent)

app.get("/",(req,res)=>{
    res.send("jai ho");
})


app.listen(process.env.SERVER_PORT,()=>{
    console.log(`server is running on http://localhost:${process.env.SERVER_PORT}`);
})