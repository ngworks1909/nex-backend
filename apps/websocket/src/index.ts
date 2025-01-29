import express from "express"
import cors from 'cors'
import dotenv from 'dotenv'
import { WebSocketServer } from 'ws'
import url from 'url'
import { extractJwtToken } from "./middlewares/auth"
import { userManager } from "./managers/user/UserManager"


dotenv.config()
const app = express();

app.use(express.json())
app.use(express.static("public"))
app.use(cors())


const httpServer = app.listen(8080);
const wss = new WebSocketServer({server: httpServer});

wss.on('connection', (ws, req) => {
    const parsedUrl = url.parse(req.url || '', true);
    const data = parsedUrl.query.session ?? "";
    const session =  Array.isArray(data) ? data[0] : data;
    const user = extractJwtToken(session, ws);
    if(!user){
        ws.emit('error', 'Unauthorized');
        return
    }
    userManager.addUser(user);
    ws.on("close", () => {
        userManager.removeUser(user.userId)
    });
});