const fs = require('fs');
const app = require('http').createServer(handler)
const io = require('socket.io')(app);

app.listen(8080);

function handler(req, res) {
    let local_url = req.url.split("?");
    local_url = local_url[0].split("/");
    local_url = local_url[1];
    local_url = local_url === "" ? "index.html" : local_url;
    fs.readFile(local_url,
        (err, data) => {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading:' + req.url);
            }

            if (req.url.includes(".js")) {
                res.setHeader("Content-Type", "application/javascript");
            }
            
            res.writeHead(200);
            res.end(data);
        });
}

io.sockets.on('connection', function (socket) {
    socket.on('message', function (message) {
        if (message.type === "join") {
            socket.join(message.value);
        }
        message.from = socket.id;
        if (message.to) {
            const targetSocket = io.sockets.sockets[message.to];
            targetSocket.emit("message", message);
        } else {
            socket.broadcast.emit('message', message);
        }
    });
});
