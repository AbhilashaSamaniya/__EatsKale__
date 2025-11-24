import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export const usePushNotifications = () => {
  const { toast } = useToast();

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && 'serviceWorker' in navigator) {
      requestNotificationPermission();
    }
  }, []);

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted');
        scheduleReminders();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const scheduleReminders = () => {
    // Schedule daily meal reminders
    const now = new Date();
    const breakfastTime = new Date();
    breakfastTime.setHours(8, 0, 0);
    
    const lunchTime = new Date();
    lunchTime.setHours(12, 0, 0);
    
    const dinnerTime = new Date();
    dinnerTime.setHours(18, 0, 0);

    [breakfastTime, lunchTime, dinnerTime].forEach((time, index) => {
      const mealNames = ['breakfast', 'lunch', 'dinner'];
      if (time > now) {
        const timeout = time.getTime() - now.getTime();
        setTimeout(() => {
          sendNotification(`Time for ${mealNames[index]}!`, 'Don\'t forget to log your meal');
        }, timeout);
      }
    });
  };

  const sendNotification = (title: string, body: string) => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
        });
      });
    }
  };

  return { sendNotification };
};