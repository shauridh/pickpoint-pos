// Simple service worker untuk handle push notifications
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const title = data.title || "PickPoint Notification";
  const options = {
    body: data.body || "Ada update untuk Anda",
    icon: "/icon.png",
    badge: "/badge.png",
    ...data,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(
    event.notification?.data?.url || "/",
    self.location.origin
  ).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      (clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            if (client.url === targetUrl || client.url.startsWith(targetUrl)) {
              return client.focus();
            }
          }
        }

        const [firstClient] = clientList;
        if (firstClient && "navigate" in firstClient) {
          firstClient.navigate(targetUrl);
          return firstClient.focus();
        }

        return clients.openWindow(targetUrl);
      }
    )
  );
});
