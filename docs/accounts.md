# Connexion et récupération de l’herbier

État actuel : **signature et sauvegarde locales uniquement**. À la demande du propriétaire, les boutons Google et Apple sont préparés et annoncent explicitement que leur connexion n’est pas encore activée. Ils n’envoient aucune donnée, ne créent aucun faux compte et ne promettent aucune récupération après désinstallation. L’export/import JSON manuel n’est plus proposé.

Pour activer la récupération réelle, il faudra fournir un projet de service d’authentification et de stockage (par exemple Firebase Authentication et Firestore), ses identifiants publics d’application, les domaines autorisés et les fournisseurs Google et Apple configurés. Les clés privées Apple et les éventuels secrets de serveur doivent rester hors du dépôt et du client. La simple présence d’un compte Play Store sur le téléphone ne constitue pas une authentification du jeu.

L’intégration devra couvrir :

- Connexion Google sur le Web et Android avec les identifiants OAuth adaptés ; configuration du package Android et des empreintes de signature. Play Games constitue un autre fournisseur si le propriétaire le choisit.
- Sign in with Apple avec l’équipe développeur, l’identifiant d’application/service et les URL de retour ; prise en charge des annulations et des comptes à adresse masquée.
- Validation du jeton par le service d’authentification ; données distantes sous l’identifiant authentifié, règles de sécurité par utilisateur et suppression du compte.
- Fusion explicitement choisie entre progression locale et distante, sans écrasement silencieux du carnet le plus avancé. Les soldes de graines et les tentatives récompensées exigent une source de vérité fiable et une idempotence côté serveur pour éviter les doubles gains entre appareils.
- Téléversement/reprise, fonctionnement hors ligne, reconnexion, échecs réseau et essai de désinstallation/réinstallation sur de vrais appareils. Un pseudo ne remplace jamais le jeton d’un fournisseur.

Le propriétaire a indiqué le 5 novembre 2026 qu’aucun de ces services n’était encore configuré et a demandé de préparer le carnet et les boutons. Aucun compte externe ni service payant n’a été créé.
