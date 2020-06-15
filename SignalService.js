export default function SignalService(socket) {
    const callbacks = {};
    this.addListener = function (messageType, callback) {
        const call_list = messageType in callbacks ? callbacks[messageType] : [];
        call_list.push(callback);
        callbacks[messageType] = call_list;
    }

    this.sendMessage = function (type, value, to = null) {
        const message = {"type": type, "value": value};
        if (to) {
            message.to = to;
        }
        // console.log("[Log] send message:", message);
        socket.emit('message', message);
    }

    function defaultCallback(message) {
        console.log("Unhandled signal message", message);
    }

    function onSocketMessage(message) {
        if (message.type in callbacks) {
            const call_list = callbacks[message.type];
            for (let index in call_list) {
                const cb = call_list[index];
                cb(message.from, message.value);
            }
        } else {
            defaultCallback(message);
        }
    }

    socket.on('message', onSocketMessage);
}
