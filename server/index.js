import express from 'express';
import { Server } from 'socket.io';
import { createServer }  from 'http';
import cors from 'cors';
import router from './router.js'
import  { addUser, removeUser, getUser, getUsersInRoom} from './users.js';

const PORT = process.env.PORT || 5000;

const corsOptions={
    cors: true,
    origins:["http://localhost:3000"],
   }

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer,corsOptions);

app.use(cors());
app.use(router);

io.on('connection', (socket) => {
    console.log('We have a new connection!!!');

    socket.on('join', ({ name, room }, callback) =>{
       const { error, user } = addUser({ id: socket.id, name, room });

       if(error){
           return callback(error);
       }
       socket.emit('message', { user: 'admin', text: `${user.name}, welcome to the room ${user.room}` });
       socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name}, has joined!`});

       socket.join(user.room);

       io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});

       callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('message', { user: user.name, text: message});
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});

        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if(user){
            io.to(user.room).emit('message', { user:'admin', text: `${user.name} has left`});
        }
    });
});


httpServer.listen(PORT, () => console.log(`Server has started on port ${PORT}`));