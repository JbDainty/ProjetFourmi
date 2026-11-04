export interface CommerceAdapter {
  available: boolean;
  rewardedHint: () => Promise<boolean>;
  purchase: (product: string) => Promise<'unavailable' | 'pending' | 'verified'>;
}
// Aucun fournisseur ni identifiant de production n’est configuré. Ne jamais octroyer
// un achat à partir d’un résultat client non validé par un serveur de confiance.
export const commerce: CommerceAdapter = {
  available: false,
  rewardedHint: async () => false,
  purchase: async () => 'unavailable',
};
export const adPolicy = {
  enabled: false,
  minCompletedBetweenInterstitials: 5,
  maxPerSession: 3,
  allowedPlacements: ['between-levels'] as const,
};
