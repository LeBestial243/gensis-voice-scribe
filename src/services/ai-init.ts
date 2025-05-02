
import { aiService } from './aiService';

/**
 * Initialise le service d'IA avec les configurations appropriées
 * Cette fonction doit être appelée au démarrage de l'application
 */
export function initializeAIService(): void {
  // En production, les clés API devraient être sécurisées via un service backend
  // Pour le développement, nous utilisons les variables d'environnement
  
  // Vous pouvez configurer les paramètres du service AI ici si nécessaire
  // Exemple: 
  // aiService.config = { ... }
  
  console.log("Service d'IA initialisé");
}

export default aiService;
