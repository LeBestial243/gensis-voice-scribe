
import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface NavigationLink {
  path: string;
  label: string;
  icon: React.ReactNode;
}

interface ModernNavigationProps {
  links: NavigationLink[];
  className?: string;
}

export function ModernNavigation({ links, className }: ModernNavigationProps) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>(location.pathname);

  // Mise à jour de l'onglet actif lors des changements d'URL
  useEffect(() => {
    setActiveTab(location.pathname);
  }, [location.pathname]);

  return (
    <div className={cn(
      "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50",
      "w-auto py-2 px-2",
      "bg-white/80 backdrop-blur-xl rounded-full",
      "border border-white/30 shadow-lg",
      className
    )}>
      <div className="flex items-center relative">
        {links.map((link) => {
          const isActive = activeTab === link.path;
          
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "relative flex items-center justify-center h-12 px-5 transition-all duration-300",
                "text-gray-500 hover:text-gray-800",
                "z-20"
              )}
              onClick={() => setActiveTab(link.path)}
            >
              <span className="relative z-20 flex items-center gap-2">
                {link.icon}
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "auto", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {link.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 z-10 bg-gradient-to-r from-gensys-primary-from/10 to-gensys-primary-to/10 rounded-full"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
