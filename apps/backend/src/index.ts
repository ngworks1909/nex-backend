import express from "express"
import userRouter from "./routes/userRoute"
import homeRouter from './routes/homeRoute'
import gameRouter from './routes/gameRoute'
import cors from 'cors'
import dotenv from 'dotenv'


dotenv.config()
const app = express();

app.use(express.json())
app.use(express.static("public"))
app.use(cors())

app.use("/api/auth", userRouter)
app.use("/api/home", homeRouter)
app.use("/api/game", gameRouter)

app.listen(3001)