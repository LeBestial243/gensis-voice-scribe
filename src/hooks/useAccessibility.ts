
import { useEffect } from 'react';

type AccessibilityOptions = {
  /** Activer le focus visible renforcé */
  enhanceFocus?: boolean;
  /** Améliorer le contraste des éléments */
  enhanceContrast?: boolean;
  /** Réduire les animations */
  reduceMotion?: boolean;
};

/**
 * Hook pour gérer les fonctionnalités d'accessibilité
 */
export function useAccessibility(options: AccessibilityOptions = {}) {
  const { enhanceFocus = true, enhanceContrast = false, reduceMotion = false } = options;
  
  // Améliorer la visibilité du focus
  useEffect(() => {
    if (enhanceFocus) {
      // Ajouter une classe à l'élément HTML pour améliorer le focus
      document.documentElement.classList.add('focus-visible');
      
      // Ajouter des styles pour améliorer la visibilité du focus
      const style = document.createElement('style');
      style.innerHTML = `
        .focus-visible :focus:not(.focus-visible) {
          outline: none;
        }
        .focus-visible :focus-visible {
          outline: 3px solid #5B86E5 !important;
          outline-offset: 2px !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.documentElement.classList.remove('focus-visible');
        document.head.removeChild(style);
      };
    }
  }, [enhanceFocus]);
  
  // Gérer le contraste élevé
  useEffect(() => {
    if (enhanceContrast) {
      document.documentElement.classList.add('high-contrast');
      
      // Ajouter des styles pour un contraste élevé
      const style = document.createElement('style');
      style.innerHTML = `
        .high-contrast {
          --background: 240 10% 3%;
          --foreground: 0 0% 95%;
          --card: 240 10% 4%;
          --card-foreground: 0 0% 95%;
          --popover: 240 10% 4%;
          --popover-foreground: 0 0% 95%;
          --primary: 240 5% 84%;
          --primary-foreground: 240 5% 10%;
          --secondary: 240 4% 18%;
          --secondary-foreground: 0 0% 95%;
          --accent: 240 4% 18%;
          --accent-foreground: 0 0% 95%;
          --destructive: 0 62% 50%;
          --destructive-foreground: 0 0% 95%;
          --muted: 240 4% 18%;
          --muted-foreground: 240 6% 65%;
          --border: 240 4% 23%;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.documentElement.classList.remove('high-contrast');
        document.head.removeChild(style);
      };
    }
  }, [enhanceContrast]);
  
  // Réduire les animations
  useEffect(() => {
    if (reduceMotion) {
      document.documentElement.classList.add('reduce-motion');
      
      // Ajouter des styles pour réduire les animations
      const style = document.createElement('style');
      style.innerHTML = `
        .reduce-motion * {
          transition-duration: 0.001ms !important;
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          scroll-behavior: auto !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.documentElement.classList.remove('reduce-motion');
        document.head.removeChild(style);
      };
    }
  }, [reduceMotion]);
  
  // Utilitaire pour gérer la navigation au clavier
  const setupKeyboardNavigation = (containerId: string) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    container.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    });
  };
  
  return {
    setupKeyboardNavigation,
  };
}
