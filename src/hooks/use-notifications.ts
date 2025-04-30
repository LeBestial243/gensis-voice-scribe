
import { useState } from "react";
import { Notification } from "@/components/NotificationSystem";

export const useNotifications = (initialNotifications: Notification[] = []) => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [isOpen, setIsOpen] = useState(false);
  
  const addNotification = (notification: Omit<Notification, "id" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
    };
    
    setNotifications((prev) => [newNotification, ...prev]);
  };
  
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };
  
  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };
  
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };
  
  const dismissAll = () => {
    setNotifications([]);
  };
  
  const togglePanel = () => {
    setIsOpen((prev) => !prev);
  };
  
  const closePanel = () => {
    setIsOpen(false);
  };
  
  const unreadCount = notifications.filter((n) => !n.read).length;
  
  return {
    notifications,
    unreadCount,
    isOpen,
    addNotification,
    markAsRead,
    dismiss,
    markAllAsRead,
    dismissAll,
    togglePanel,
    closePanel,
  };
};
