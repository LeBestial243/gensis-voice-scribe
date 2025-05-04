
import { aiService } from './aiService';

/**
 * Initialise le service d'IA avec les configurations appropriées
 * Cette fonction doit être appelée au démarrage de l'application
 */
export function initializeAIService(): void {
  // En production, les clés API devraient être sécurisées via un service backend
  // Pour le développement, nous utilisons les variables d'environnement
  
  // Configuration de base pour le service AI
  aiService.config = {
    apiEndpoint: "https://api.anthropic.com/v1",
    apiKey: "",
    model: "claude-3-sonnet-20240229",
    temperature: 0.3
  };
  
  console.log("Service d'IA initialisé");
}

export default aiService;
