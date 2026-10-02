# Limites connues — distribution carburants (correctif 4b)

Constats de la revue indépendante du 2026-10-02, commit `af5ee75`. Rien n'est
corrigé ici : ce sont des choix de méthode ou des durcissements à décider.

## Choix de méthode à trancher

1. **Report aval sans limite.** `int_carburant_station_periode` plafonne le
   report à 30 jours en amont (début de période) mais prolonge le dernier prix
   d'une station jusqu'à la fin de période sans limite. Octobre 2022 : 128
   stations avec un dernier relevé à plus de 30 jours de la fin. Écart médiane −
   Insee 2026 resté ≤ 0,022 €/L.
2. **Stations exclues sans compteur.** Une station sans relevé dans la période
   est exclue, même avec un relevé valide dans les 30 jours précédents (voulu,
   testé : `periode_sans_declaration_station_exclue`). Si le flux n'enregistre que
   les changements de prix, les stations à prix stable sont écartées et la
   médiane penche vers celles qui bougent. Aucun compteur d'exclusions publié.

## Durcissements (LOW)

- `coherence_carburants_insee` (warn) passe sans alerte si aucun mois n'est
  comparé : ajouter un contrôle du nombre de mois comparés.
- `ingest/insee_ipc.py` : `--carburants --depuis 2022-04` est remplacé
  silencieusement par `2022-01` (valeur par défaut utilisée comme sentinelle).
- Tests manquants : période ouverte, prolongement aval, relevé exactement à
  `debut_utc` (04:00 UTC).
- `test_iterer_membre_xml_egal_parser` n'a plus d'oracle externe (fichier
  `/private/tmp` disparu) : il vérifie l'égalité des deux parseurs seulement.
- Front : la colonne `mois` vaut `debut_effet` (le 2022-11-16 s'affiche
  « novembre 2022 », octobre 2022 couvre 46 jours) ; renommage prévu à
  l'incrément 5.
- Infobulle du graphe carburants : fond blanc et texte pâle, illisible en thème
  sombre (constat navigateur, à traiter à l'incrément 5).

## Mesure de mémoire

`make publier-carburants` : RSS max 4,37 Go, 41 min (seuil visé : 2 Go).
