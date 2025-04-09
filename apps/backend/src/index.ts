import express from "express"
import userRouter from "./routes/userRoute"
import dataRouter from './routes/dataRoute'
import cors from 'cors'
import dotenv from 'dotenv'


dotenv.config()
const app = express();

app.use(express.json())
app.use(express.static("public"))
app.use(cors())

app.use("/api/auth", userRouter)
app.use("/api/data", dataRouter)

app.listen(3001)