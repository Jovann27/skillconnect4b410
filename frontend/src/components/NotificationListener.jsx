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

        socket.on("appointment-notification", (data) => {
            console.log("Appointment-notification:", data);

            toast.info(`${data.title}: ${new Date(data.appointment.appointmentDate).toLocaleString()}`, {
                position: "top-right",
                autoClose: 8000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        });


        socket.on("verification-status", (data) => {
            console.log("Verification update:", data);
            toast.info(`Verification status updated: ${data.status}`, {
                position: "top-right",
                autoClose: 8000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        });

        socket.on("request-cancelled", (data) => {
            console.log("Request cancelled notification:", data);

            toast.warn(
                data.message || "A service request was been cancelled.",
                {
                    position: "top-right",
                    autoClose: 8000,
                    hideProgressBar: false,
                }
            );
        });

        socket.on("service-request-updated", (data) => {
            if(data.action === "cancelled") {
                toast.info("A service request has been cancelled.", {
                    position: "top-right",
                    autoClose: 8000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
            }
        });

        socket.on("request-accepted", (data) => {
            toast.success("A service request has been accepted.", {
                position: "top-right",
                autoClose: 8000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        });

        return () => {
            socket.off("new-notification");
            socket.off("appointment-notification");
            socket.off("verification-status");
            socket.off("request-cancelled");
            socket.off("service-request-updated");
            socket.off("request-accepted");
        };
    }, [user]);

    return null;
}
