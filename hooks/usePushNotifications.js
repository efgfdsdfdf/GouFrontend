import { useEffect } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import { useAuthStore } from "../store";
export const usePushNotifications = () => {
    const { isAuthenticated } = useAuthStore();
    const pushEnabled = import.meta.env.VITE_ENABLE_PUSH_NOTIFICATIONS === "true";
    useEffect(() => {
        if (!pushEnabled || !isAuthenticated || !Capacitor.isNativePlatform()) {
            return;
        }
        let isCancelled = false;
        const listenerHandles = [];
        const registerPush = async () => {
            try {
                let permStatus = await PushNotifications.checkPermissions();
                if (permStatus.receive !== "granted") {
                    // Do not auto-prompt at startup; request from an explicit settings action.
                    console.warn("Push permission not granted yet; skipping registration.");
                    return;
                }
                if (isCancelled)
                    return;
                listenerHandles.push(await PushNotifications.addListener("registration", (token) => {
                    console.log("Push registration success, token:", token.value);
                    // TODO: Send this token to your backend API to save it
                    // Example: api.notifications.saveToken(token.value);
                }));
                listenerHandles.push(await PushNotifications.addListener("registrationError", (error) => {
                    console.error("Push registration error:", error);
                }));
                listenerHandles.push(await PushNotifications.addListener("pushNotificationReceived", (notification) => {
                    console.log("Push received:", notification);
                }));
                listenerHandles.push(await PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
                    console.log("Push action performed:", notification);
                }));
                await PushNotifications.register();
            }
            catch (error) {
                // Prevent fatal startup crashes on devices with partial push setup.
                console.error("Push initialization failed:", error);
            }
        };
        void registerPush();
        return () => {
            isCancelled = true;
            listenerHandles.forEach((handle) => {
                void handle.remove();
            });
        };
    }, [isAuthenticated, pushEnabled]);
};
