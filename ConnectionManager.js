import SignalService from './SignalService.js';


const configuration = {
    'iceServers': [
        {urls: 'stun:stun.l.google.com:19302'},
        {urls: 'stun:stun1.l.google.com:19302'},
        {urls: 'stun:stun2.l.google.com:19302'},
        {urls: 'stun:stun3.l.google.com:19302'},
        {urls: 'stun:stun4.l.google.com:19302'}
    ]
};
const offerOptions = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1,
    offerToReceiveData: 1,
    iceRestart: true
};

export default function ConnectionManager(socket) {
    const connections = {};

    const signal = new SignalService(socket);
    signal.addListener("join", (uid, value) => connections[uid] = new Connection(signal, uid));
    signal.addListener("offer", (uid, offer) => connections[uid] = new Connection(signal, uid, offer));

    this.getConnections = function () {
        return connections;
    }

    this.connect = function (room_id) {
        signal.sendMessage("join", room_id);
    }
}

function Connection(signal, uid, offer = null) {

    let dataChanel = null;

    const peerConnection = new RTCPeerConnection(configuration);

    peerConnection.addEventListener('icecandidate', event => {
        // console.log("[RTCPeerConnection] icecandidate");
        if (event.candidate) {
            signal.sendMessage("candidate", event.candidate, uid);
        }
    });
    peerConnection.addEventListener('connectionstatechange', event => {
        console.log("[RTCPeerConnection] connectionstatechange", peerConnection.connectionState);
        if (peerConnection.connectionState === "connected") {
        }
    });
    peerConnection.addEventListener('datachannel', event => {
        const ch = event.channel;
        initDataChannel(ch);
    });

    function initDataChannel(ch) {
        console.log("init data channel")
        dataChanel = ch;
        ch.bufferedAmountLowThreshold = 0;
        ch.addEventListener("open", ev => console.log("Data ch open", ev));
        ch.addEventListener("bufferedamountlow", ev => console.log("Data ch bufferedamountlow", ev));
        ch.addEventListener("close", ev => console.log("Data ch close", ev));
        ch.addEventListener("error", ev => console.log("Data ch error", ev));
        ch.addEventListener("message", ev => console.log("Data ch message", ev));
    }

    async function createOffer(uid) {
        const ch = peerConnection.createDataChannel("my_data_channel", {"negotiated": false});
        initDataChannel(ch);
        const offer = await peerConnection.createOffer(offerOptions);
        await peerConnection.setLocalDescription(offer);
        signal.sendMessage("offer", offer, uid);
    }

    async function createAnswer(uid, offer) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        signal.sendMessage("answer", answer, uid)
    }

    async function applyAnswer(uid, answer) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("[Log] Connection created");
    }

    async function applyCandidate(uid, iceCandidate) {
        try {
            await peerConnection.addIceCandidate(iceCandidate);
        } catch (e) {
            console.error('Error adding received ice candidate', e);
        }
    }

    function init() {
        signal.addListener("answer", (from, value) => applyAnswer(from, value));
        signal.addListener("candidate", (from, value) => applyCandidate(from, value));

        if (offer) {
            createAnswer(uid, offer);
        } else {
            createOffer(uid);
        }
    }

    this.send = function (value) {
        dataChanel.send(value);
    }

    init();


}
