
import React from "react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface NavigationLink {
  path: string;
  label: string;
  icon: React.ReactNode;
}

interface DesktopNavLinkProps {
  path: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
}

function DesktopNavLink({ path, label, icon, isActive }: DesktopNavLinkProps) {
  return (
    <Link
      to={path}
      className={cn(
        "relative group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
        "hover:bg-white/50",
        isActive ? "text-gensys-primary-to font-medium" : "text-gray-600"
      )}
    >
      <div className="relative">
        <div className={cn(
          "absolute -inset-1.5 rounded-lg bg-gradient-to-r",
          "from-gensys-primary-from/0 to-gensys-primary-to/0",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          isActive && "from-gensys-primary-from/10 to-gensys-primary-to/10 opacity-100"
        )} />
        <span className="relative">{icon}</span>
      </div>
      <span>{label}</span>
      
      {isActive && (
        <motion.div
          className="absolute left-0 w-1 h-8 rounded-r-full bg-gradient-to-b from-gensys-primary-from to-gensys-primary-to"
          layoutId="sidebar-active-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </Link>
  );
}

interface PremiumDesktopNavigationProps {
  links: NavigationLink[];
  className?: string;
}

export function PremiumDesktopNavigation({ links, className }: PremiumDesktopNavigationProps) {
  const location = useLocation();
  
  return (
    <div className={cn(
      "space-y-1 py-4 bg-white/60 backdrop-blur-lg rounded-2xl",
      "border border-white/20 shadow-glass",
      className
    )}>
      {links.map((link) => (
        <DesktopNavLink
          key={link.path}
          path={link.path}
          label={link.label}
          icon={link.icon}
          isActive={location.pathname === link.path}
        />
      ))}
    </div>
  );
}
