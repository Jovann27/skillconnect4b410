import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
    withCredentials: true,
    auth: {
        token: localStorage.getItem("token") || ""
    }
});

// Update token when user logs in
export const updateSocketToken = (token) => {
    socket.auth.token = token;
    socket.disconnect();
    socket.connect();
};

export default socket;
