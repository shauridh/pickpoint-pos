import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

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

    setIsLoading(true);

    try {
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        // Register service worker
        const registration = await navigator.serviceWorker.register(
          "/service-worker.js",
          { scope: "/" }
        );

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;

        // Get push subscription
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env
            .NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });

        // Send subscription to server via API
        const response = await fetch("/api/auth/push-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
        });

        if (response.ok) {
          setIsSubscribed(true);
          toast({
            title: "Berhasil",
            description: "Notifikasi aktif untuk akun Anda",
          });
        } else {
          toast({
            title: "Error",
            description: "Gagal menyimpan subscription",
            variant: "destructive",
          });
        }
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
