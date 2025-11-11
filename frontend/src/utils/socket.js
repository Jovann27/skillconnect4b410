import { io } from "socket.io-client";

let _socket = null;
let pendingListeners = [];

const socketClient = {
    on(event, cb) {
        if (_socket && typeof _socket.on === "function") return _socket.on(event, cb);
        pendingListeners.push({ event, cb });
    },
    off(event, cb) {
        if (_socket && typeof _socket.off === "function") return _socket.off(event, cb);
        pendingListeners = pendingListeners.filter(l => {
            if (l.event !== event) return true;
            if (cb) return l.cb !== cb;
            return false;
        });
    },
    emit(event, ...args) {
        if (_socket && typeof _socket.emit === "function") return _socket.emit(event, ...args);
    },
    disconnect() {
        if (_socket && typeof _socket.disconnect === "function") {
            _socket.disconnect();
            _socket = null;
        }
    },
    get connected() {
        return _socket ? _socket.connected : false;
    },
    _getRaw() {
        return _socket;
    }
};

const initializeSocket = (token) => {
    if (!token) {
        return null;
    }

    _socket = io("http://192.168.1.13:4000", {
        withCredentials: true,
        auth: { token }
    });

    _socket.on("connect_error", (error) => {
        console.warn("Socket connection error:", error.message);
        if (error.message === "Authentication error") {
            _socket.disconnect();
            _socket = null;
        }
    });

    _socket.on("connect", () => {
        console.log("Socket connected successfully");
    });

    if (pendingListeners.length > 0) {
        pendingListeners.forEach(({ event, cb }) => {
            try {
                _socket.on(event, cb);
            } catch (err) {
                console.error("Failed to attach pending listener", event, err);
            }
        });
        pendingListeners = [];
    }

    return _socket;
};

// Don't auto-initialize socket on module load
// _socket = initializeSocket();

export const updateSocketToken = (token) => {
    if (_socket) {
        _socket.disconnect();
        _socket = null;
    }

    if (token) {
        localStorage.setItem("token", token);
        _socket = initializeSocket(token);
    } else {
        localStorage.removeItem("token");
        _socket = null;
    }
};

export const clearSocket = () => {
    if (_socket) {
        _socket.disconnect();
        _socket = null;
    }
    localStorage.removeItem("token");
};

export default socketClient;