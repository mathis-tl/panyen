# Limites connues — distribution carburants (correctif 4b)

Constats de la revue indépendante du 2026-10-02, commit `af5ee75`. Les choix
de méthode ci-dessous ne sont pas tranchés : les changer demanderait de
republier les carburants. Les contrôles du 2026-10-06 ne changent pas les prix.

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

## Contrôles ajoutés (2026-10-06, sans republication)

- `coherence_carburants_insee_mois` (error) échoue si aucun mois plein n'est
  comparé à l'Insee. `coherence_carburants_insee` reste un warn sur l'écart
  de 0,05 €/L : un écart connu ne bloque pas le build.
- `ingest/insee_ipc.py` : `--depuis` absent vaut `2022-04` pour l'IPC et
  `2022-01` pour `--carburants`. Une date passée explicitement est utilisée
  telle quelle, y compris `--carburants --depuis 2022-04`.
- Tests unitaires synthétiques, modèle inchangé :
  `periode_ouverte_finit_au_dernier_releve` (la fin ouverte est le dernier
  relevé global ; un relevé exactement à cette fin n'entre pas),
  `periode_prolongement_aval_sans_limite` (une station dont le seul relevé est
  au début d'une période de deux mois reste, à ce prix — le test verrouille la
  présence, pas la durée du segment),
  `periode_releve_exactement_a_debut_utc` (04:00 UTC inclus).

## Encore ouverts

- `test_iterer_membre_xml_egal_parser` n'a plus d'oracle externe (fichier
  `/private/tmp` disparu) : il vérifie l'égalité des deux parseurs seulement.
- Front : la colonne `mois` vaut `debut_effet` (le 2022-11-16 s'affiche
  « novembre 2022 », octobre 2022 couvre 46 jours). Le renommage changerait
  le Parquet publié : il attend une republication.
- L'infobulle illisible en thème sombre est sans objet : le site n'a plus
  qu'un thème clair (décision du 2026-10-06).

## Mesure de mémoire

`make publier-carburants` : RSS max 4,37 Go, 41 min (seuil visé : 2 Go).
