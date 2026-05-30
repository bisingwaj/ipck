import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';

/** Référence globale de navigation : permet de naviguer hors des composants
 *  (ex. perte de session sur 401 depuis la couche API). */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** Réinitialise la pile sur un écran racine (no-op si le conteneur n'est pas prêt). */
export function resetTo(name: keyof RootStackParamList) {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name: name as any }] });
  }
}
