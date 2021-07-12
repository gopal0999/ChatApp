const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const hbs = require('hbs')
const bodyParser = require('body-parser')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://<username>:<password>@cluster0.ii2uh.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const port = process.env.PORT || 3000

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, '../public')
const viewsPath = path.join(__dirname, '../templates/views')
const partialsPath = path.join(__dirname, '../templates/partials')

// Setup handlebars engine and views location
app.set('view engine', 'hbs')
app.set('views', viewsPath)
hbs.registerPartials(partialsPath)

// Setup static directory to serve
app.use(express.static(publicDirectoryPath))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

/**
 * Socket.io connection and event
 */
const userSocketMapper = {}
io.on('connection', (socket) => {
    console.log("socket connection successful")
    /**
     * help us save the socketID
     */
    socket.on('socketID', async (options, callback) => {
        userSocketMapper[options.userID] = options.socketID
        console.log(userSocketMapper)
        // now here we should check if its a new user then we should broadcast 
        // a newUser joined event to all other users and reflect it in the userlist in the bottom
    })

    /**
     * help us send the message for a user and also save it in db
     */
    socket.on('message', async (options) => {
        // options will have content, toUsername, fromUsername
        // as per toUsername will get current socketID to send to
        // then save the messages
        // send the message to the socketID
        const content = options.content
        if (options.roomName) {
            try {
                await client.connect();
                const database = client.db("ChatApp");
                const messages = database.collection("Messages");
                // create a document to be inserted
                const doc = { roomName: options.roomName, content: content, timestamp: +new Date };
                const result = await messages.insertOne(doc);
                console.log(
                    `${result.insertedCount} documents were inserted with the _id: ${result.insertedId}`,
                );
            } catch (error) {
                console.log(error)
            }
        } else {
            const fromUsername = options.fromUsername
            const toUsername = options.toUsername
            if (content && content != "" && fromUsername && toUsername) {
                try {
                    await client.connect();
                    const database = client.db("ChatApp");
                    const messages = database.collection("Messages");
                    // create a document to be inserted
                    const doc = { from: fromUsername, to: toUsername, content: content, timestamp: +new Date };
                    const result = await messages.insertOne(doc);
                    console.log(
                        `${result.insertedCount} documents were inserted with the _id: ${result.insertedId}`,
                    );
                } catch (error) {
                    console.log(error)
                }
                console.log(userSocketMapper)
                const socketid = userSocketMapper[toUsername]
                socket.broadcast.to(socketid).emit("message", content);
            }
        }
    })
})

/**
 * APIS and View rendering here
 */

/**
 * Will render the home page
 */
app.get('', (req, res) => {
    res.render('index')

})

/**
 * addUser will render the chat page with userlist
 */
app.post('/addUser', async (req, res) => {
    if (req.body && req.body.username) {
        let userList;
        try {
            await client.connect();
            const database = client.db("ChatApp");
            const users = database.collection("Users");
            const doc = { username: req.body.username };
            const user = await users.find(doc).toArray()
            if (user.length === 0) {
                const result = await users.insertOne(doc);
                console.log(
                    `${result.insertedCount} documents were inserted with the _id: ${result.insertedId}`,
                );
            }
            userList = await users.find().toArray();
        } catch (error) {
            console.log(error)
        }
        if (!(req.body.username in userSocketMapper)) {
            // caching can be used here as well as in above case where we are saving socketID
            userSocketMapper[req.body.username] = ""
            console.log(userSocketMapper)
            io.on("connection", async (socket) => {
                console.log("check if connection is successful")
                socket.broadcast.emit("newUser", req.body.username)
            })
            // when new user joins we should send it the list of all current users
        }
        res.render('chat', {
            userList: userList
        })
    }
})

/**
 * API to fetch the messages between users or for a room
 */
app.post("/messages", async (req, res) => {
    if (req.body && req.body.roomName) {
        // fetch the last 10 messages for the room
        try {
            await client.connect();
            const database = client.db("ChatApp");
            const messages = database.collection("Messages");
            // last 10 messages here
            const last10Messages = await messages.find({ roomName: req.body.roomName }).sort({ "timestamp": -1 }).limit(10).toArray();
            res.status(200).send(last10Messages);
        } catch (error) {
            console.log(error)
        }

    } else {
        // fetch the meesages between the to and from user
        if (req.body && req.body.toUsername && req.body.fromUsername) {
            try {
                await client.connect();
                const database = client.db("ChatApp");
                const messages = database.collection("Messages");

                // last 10 messages here
                const last10Messages = await messages.find(
                    {
                        $and: [
                            {
                                $or: [{ to: req.body.toUsername}, {to: req.body.fromUsername }]
                            },
                            {
                                $or: [{ from: req.body.toUsername}, {from: req.body.fromUsername }]
                            }
                        ]
                    }).sort({ "timestamp": -1 }).limit(10).toArray();
                res.status(200).send(last10Messages);
            } catch (error) {
                console.log(error)
            }
        } else {
            res.status(400).send({ message: "to or from not provided" })
        }

    }
})

/**
 * Will render 404
 */
app.get('*', (req, res) => {
    res.render('404', {
        errorMessage: 'Page not found.'
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})