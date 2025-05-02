
import { aiService } from './aiService';

/**
 * Initialise le service d'IA avec les configurations appropriées
 * Cette fonction doit être appelée au démarrage de l'application
 */
export function initializeAIService(): void {
  // En production, les clés API devraient être sécurisées via un service backend
  // Pour le développement, nous utilisons une variable temporaire
  
  // Rôle du service: mettre à jour la configuration du service AI avec les bonnes valeurs
  // sans exposer les clés API directement dans le code
  
  console.log("Service d'IA initialisé");
}

export default aiService;
