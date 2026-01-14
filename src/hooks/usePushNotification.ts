import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export function usePushNotification() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if service workers and push notifications are supported
    const supported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window;
    setIsSupported(supported);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const detectExistingSubscription = async () => {
      if (!isSupported) return;
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (isMounted) {
          setIsSubscribed(!!subscription);
        }
      } catch (error) {
        console.error("Push subscription detection error:", error);
      }
    };

    detectExistingSubscription();

    return () => {
      isMounted = false;
    };
  }, [isSupported]);

  const requestNotificationPermission = async () => {
    if (!isSupported) {
      toast({
        title: "Browser tidak support",
        description:
          "Notifikasi push tidak didukung di browser Anda",
        variant: "destructive",
      });
      return;
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      toast({
        title: "Konfigurasi tidak lengkap",
        description: "VAPID public key belum diatur",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        const existingRegistration = await navigator.serviceWorker.getRegistration();
        if (!existingRegistration) {
          await navigator.serviceWorker.register("/service-worker.js", { scope: "/" });
        }
        const registration = await navigator.serviceWorker.ready;
        const pushManager = registration.pushManager;
        const existingSubscription = await pushManager.getSubscription();
        const subscription =
          existingSubscription ||
          (await pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          }));

        const response = await fetch("/api/auth/push-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
        });

        if (!response.ok) {
          throw new Error("Failed to save subscription");
        }

        setIsSubscribed(true);
        toast({
          title: "Berhasil",
          description: existingSubscription
            ? "Notifikasi sudah aktif"
            : "Notifikasi aktif untuk akun Anda",
        });
      }
    } catch (error) {
      console.error("Push notification error:", error);
      toast({
        title: "Error",
        description: "Gagal mengaktifkan notifikasi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    requestNotificationPermission,
  };
}
