import express from 'express'
import mongoose from "mongoose";
import 'dotenv/config';
import cors from 'cors'
import { getNews } from './controllers/newsController.js';
import db from './db/db.js';

db()

const app=express();
app.use(cors());
app.use(express.json());


app.get("/",(req,res)=>{
    res.send("jai ho");
})

app.get('/news',getNews);

app.listen(process.env.SERVER_PORT,()=>{
    console.log(`server is running on http://localhost:${process.env.SERVER_PORT}`);
})