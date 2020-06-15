import ConnectionManager from './ConnectionManager.js';

const room_id = "some_room_id";

export default function Client(socket) {
    const connectionManager = new ConnectionManager(socket);

    const callButton = document.getElementById("callButton");
    const helloButton = document.getElementById("helloButton");
    callButton.addEventListener("click", onConnect);
    helloButton.addEventListener("click", sayHello);

    function onConnect(event) {
        connectionManager.connect(room_id);
    }

    function sayHello(event) {
        const connections = connectionManager.getConnections();
        for (let uid in connections) {
            connections[uid].send("Hello!");
        }
    }
};
