import { useEffect } from "react";
import socket from "../utils/socket";
import { toast } from "react-toastify";

export default function NotificationListener({ user }) {
    useEffect(() => {
        if(!user?._id) return;

        console.log("Registering user for notifications:", user._id);
        socket.emit("register", user._id);

        // Request notification permission
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        socket.on("new-notification", (data) => {
            console.log("🔔 Notification Received:", data);
            toast.info(`${data.title}: ${data.message}`, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });

            // Show browser notification if permission granted
            if (Notification.permission === 'granted') {
                new Notification(data.title, {
                    body: data.message,
                    icon: '/skillconnect.png', // Assuming there's an icon in public folder
                });
            }
        });

        return () => {
            socket.off("new-notification");
        };
    }, [user]);

    return null;
}
