Tu fais le test de qualité du site déployé de Panye (panyen). Tu lis et tu mesures ; tu ne
modifies rien, tu ne commites pas, tu ne pousses pas. URL : <URL_VERCEL>.

Si l'URL n'est pas fournie, arrête-toi et demande-la.

## Mesures (mobile 375 px et bureau 1440 px, sur `/` et sur `/techos.html`)
1. **Lighthouse** (Chrome headless, `npx lighthouse <URL> --preset=desktop` et mode mobile) :
   Performance, Accessibilité, Bonnes pratiques, SEO, avec les scores et les audits en échec.
2. **Poids et réseau** : poids total transféré, 5 plus gros fichiers (vidéo du bandeau, polices,
   JS, Parquet), nombre de requêtes, **aucun hôte tiers**, en-têtes de cache des Parquet et des
   médias, compression.
3. **Console** : zéro erreur et zéro avertissement au chargement et au défilement complet.
4. **Liens** : tous les liens internes et externes (sources Insee, événements) répondent ; les
   ancres `#reponse`, `#methode`… atteignent leur section ; « Pour les techos » ↔ « Retour aux prix ».
5. **Rendu** : captures de chaque section à 375 et 1440 px ; aucun débordement horizontal ; vidéo
   muette en boucle qui démarre ; thème clair seul (aucun passage en sombre en mode sombre du
   système) ; polices chargées (pas de repli système visible).
6. **Accessibilité** : un seul h1 par page, ordre des titres, landmarks, noms accessibles des
   graphiques, parcours clavier complet avec focus visible, `prefers-reduced-motion`.
7. **Méta** : `<title>`, description, `lang="fr"`, favicon, balises Open Graph, `robots`.
8. **Données** : les chiffres de la réponse (écart estimé août 2026 : alimentation 40,4 %,
   ensemble 11,1 %) correspondent à ceux du README.

## Rendu attendu (français, court)
Un tableau : mesure → valeur → seuil visé → OK / À corriger. Puis la liste des défauts classés
(bloquant / à corriger / peut attendre) avec la page, l'élément et la phrase ou la valeur exacte.
Pas de réécriture de fond. Hors périmètre : VoiceOver, incrément 6, méthode des carburants.
