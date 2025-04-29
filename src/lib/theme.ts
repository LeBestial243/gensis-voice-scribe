
/**
 * Thème unifié pour l'application GENSYS
 * Ce fichier centralise toutes les valeurs de design système
 * pour assurer la cohérence visuelle dans toute l'application.
 */

export const theme = {
  colors: {
    primary: {
      gradient: {
        from: "var(--gensys-primary-from, #56CCF2)", // Bleu clair du logo
        via: "var(--gensys-primary-via, #5B86E5)",   // Bleu moyen
        to: "var(--gensys-primary-to, #8B5CF6)"      // Violet du logo
      },
      light: "#56CCF2",
      DEFAULT: "#5B86E5",
      dark: "#4338CA",
      hover: "#4F46E5",
      foreground: "#FFFFFF"
    },
    surface: {
      light: "#f8fafc",
      DEFAULT: "#f1f5f9",
      dark: "#e2e8f0",
    },
    glassmorphism: {
      light: "rgba(255, 255, 255, 0.7)",
      dark: "rgba(15, 23, 42, 0.6)",
      background: "rgba(255, 255, 255, 0.85)",
      border: "rgba(255, 255, 255, 0.25)",
      shadow: "rgba(31, 38, 135, 0.07)"
    },
    text: {
      title: "#111827",
      subtitle: "#6B7280",
      muted: "#6B7280"
    },
    ui: {
      card: "#FFFFFF",
      border: "hsl(var(--border))",
      input: "hsl(var(--input))",
      destructive: {
        DEFAULT: "#EF4444",
        foreground: "#FFFFFF"
      }
    }
  },
  effects: {
    blur: {
      sm: "4px",
      md: "8px",
      lg: "16px"
    },
    shadow: {
      neumorph: "5px 5px 10px rgba(0, 0, 0, 0.1), -5px -5px 10px rgba(255, 255, 255, 0.7)",
      'neumorph-hover': "8px 8px 16px rgba(0, 0, 0, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.7)",
      'neumorph-active': "inset 5px 5px 10px rgba(0, 0, 0, 0.1), inset -5px -5px 10px rgba(255, 255, 255, 0.7)",
      'neumorph-inset': "inset 2px 2px 5px rgba(0, 0, 0, 0.1), inset -2px -2px 5px rgba(255, 255, 255, 0.7)",
      card: "0px 4px 20px rgba(0, 0, 0, 0.05)"
    },
    animation: {
      transition: {
        fast: "150ms ease",
        DEFAULT: "300ms ease",
        slow: "500ms ease"
      }
    }
  },
  spacing: {
    container: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px"
    }
  },
  radius: {
    sm: "0.5rem",
    DEFAULT: "1rem",
    lg: "1.5rem",
    full: "9999px"
  }
};

/**
 * Utilitaires de thème pour faciliter l'utilisation dans les composants
 */
export const getGradient = (direction: "to-r" | "to-br" | "to-b" = "to-r") => {
  return `bg-gradient-${direction} from-[${theme.colors.primary.gradient.from}] via-[${theme.colors.primary.gradient.via}] to-[${theme.colors.primary.gradient.to}]`;
};

export const getGlassmorphism = (isDark: boolean = false) => {
  const bg = isDark ? theme.colors.glassmorphism.dark : theme.colors.glassmorphism.light;
  return `bg-${bg} backdrop-blur-${theme.effects.blur.md} border border-${theme.colors.glassmorphism.border}`;
};

export const getNeumorph = (state: "default" | "hover" | "active" = "default") => {
  switch (state) {
    case "hover":
      return `shadow-[${theme.effects.shadow["neumorph-hover"]}]`;
    case "active":
      return `shadow-[${theme.effects.shadow["neumorph-active"]}]`;
    default:
      return `shadow-[${theme.effects.shadow.neumorph}]`;
  }
};

/**
 * Types pour le système de thème
 */
export type ThemeColors = typeof theme.colors;
export type ThemeEffects = typeof theme.effects;
export type ThemeSpacing = typeof theme.spacing;
export type ThemeRadius = typeof theme.radius;
