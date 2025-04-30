
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Bell, X, Check, Clock, User, FileText, Info } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { GlassmorphicCard } from "@/components/ui/GlassmorphicCard";

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "success" | "warning" | "error" | "profile" | "note";
}

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

const NotificationItem = ({ notification, onRead, onDismiss }: NotificationItemProps) => {
  const getIconByType = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <Check className="h-5 w-5 text-green-500" />;
      case "warning":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "error":
        return <X className="h-5 w-5 text-red-500" />;
      case "profile":
        return <User className="h-5 w-5 text-gensys-primary-to" />;
      case "note":
        return <FileText className="h-5 w-5 text-gensys-primary-from" />;
      case "info":
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div 
      className={cn(
        "p-4 border-b border-gray-100 last:border-0 transition-colors duration-300",
        notification.read ? "bg-transparent" : "bg-blue-50/30"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex-shrink-0 p-2 rounded-full",
          notification.read ? "bg-gray-100" : "bg-white shadow-sm"
        )}>
          {getIconByType(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "text-sm font-medium",
            notification.read ? "text-gray-700" : "text-gray-900"
          )}>
            {notification.title}
          </h4>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {notification.message}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">{notification.time}</span>
            <div className="flex gap-1">
              {!notification.read && (
                <button 
                  onClick={() => onRead(notification.id)}
                  className="text-xs text-gray-500 hover:text-gensys-primary-to transition-colors px-2 py-1 rounded-md hover:bg-gray-100"
                >
                  Marquer comme lu
                </button>
              )}
              <button 
                onClick={() => onDismiss(notification.id)}
                className="text-xs text-gray-500 hover:text-red-500 transition-colors px-2 py-1 rounded-md hover:bg-gray-100"
              >
                Ignorer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onReadAll: () => void;
  onDismissAll: () => void;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

export const NotificationPanel = ({
  isOpen,
  onClose,
  notifications,
  onReadAll,
  onDismissAll,
  onRead,
  onDismiss
}: NotificationPanelProps) => {
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <div className={cn(
      "fixed top-16 right-4 z-50 w-96 transform transition-all duration-300 ease-in-out",
      isOpen 
        ? "translate-y-0 opacity-100" 
        : "translate-y-2 opacity-0 pointer-events-none"
    )}>
      <GlassmorphicCard variant="premium" className="shadow-lg overflow-hidden max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="h-5 w-5 text-gensys-primary-to" />
            Notifications
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-primary text-white">
                {unreadCount}
              </span>
            )}
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={onReadAll}
              disabled={unreadCount === 0}
              className={cn(
                "text-xs text-gray-500 transition-colors",
                unreadCount > 0 
                  ? "hover:text-gensys-primary-to" 
                  : "opacity-50 cursor-not-allowed"
              )}
            >
              Tout marquer comme lu
            </button>
            <button 
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1">
          {notifications.length > 0 ? (
            <div>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={onRead}
                  onDismiss={onDismiss}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">Aucune notification</p>
              <p className="text-xs text-gray-400">Vous recevrez des notifications pour les mises à jour importantes</p>
            </div>
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="p-3 border-t border-gray-100 bg-gray-50/50">
            <PremiumButton 
              variant="soft" 
              className="w-full py-1.5 text-xs justify-center"
              onClick={onDismissAll}
            >
              Tout effacer
            </PremiumButton>
          </div>
        )}
      </GlassmorphicCard>
    </div>
  );
};

// Badge de notification qui montre le nombre de notifications
export const NotificationBadge = ({ count, onClick }: { count: number; onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-center"
    >
      <div className={cn(
        "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-white z-10",
        count > 0
          ? "bg-gradient-to-r from-gensys-primary-from to-gensys-primary-to animate-pulse"
          : "bg-gray-300"
      )}>
        {count > 9 ? "9+" : count}
      </div>
      <PremiumButton variant="glassmorphic" size="icon">
        <Bell className="h-5 w-5" />
      </PremiumButton>
    </button>
  );
};

// Composant qui regroupe tout le système de notification
export const NotificationSystem = () => {
  // Exemple de données de notification
  const initialNotifications: Notification[] = [
    {
      id: "1",
      title: "Nouveau profil créé",
      message: "Le profil de Thomas Dubois a été créé avec succès.",
      time: "Il y a 10 minutes",
      read: false,
      type: "profile",
    },
    {
      id: "2",
      title: "Transcription terminée",
      message: "La transcription de l'enregistrement 'Entretien 28/04/2025' est prête.",
      time: "Il y a 2 heures",
      read: false,
      type: "success",
    },
    {
      id: "3",
      title: "Note générée",
      message: "La note pour Marie Lefèvre a été générée et sauvegardée.",
      time: "Hier",
      read: true,
      type: "note",
    },
  ];
  
  const {
    notifications,
    unreadCount,
    isOpen,
    markAsRead,
    dismiss,
    markAllAsRead,
    dismissAll,
    togglePanel,
    closePanel,
  } = useNotifications(initialNotifications);
  
  return (
    <>
      <NotificationBadge count={unreadCount} onClick={togglePanel} />
      <NotificationPanel
        isOpen={isOpen}
        onClose={closePanel}
        notifications={notifications}
        onReadAll={markAllAsRead}
        onDismissAll={dismissAll}
        onRead={markAsRead}
        onDismiss={dismiss}
      />
    </>
  );
};
