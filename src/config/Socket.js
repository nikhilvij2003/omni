import { io } from "socket.io-client";

const socket = io("https://chatbot-5hyt.onrender.com", {
//   transports: ["websocket"], // optional: use websocket only
});

export default socket;