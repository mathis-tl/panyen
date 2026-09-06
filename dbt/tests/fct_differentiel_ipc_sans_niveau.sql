-- Aucune colonne de niveau d'indice ne sort de int_ipc_rebase vers la fact.
-- Le ref crée la dépendance pour que make verify exécute ce garde-fou.
with colonnes as (
    select column_name
    from (describe select * from {{ ref("fct_differentiel_ipc") }})
)

select column_name
from colonnes
where column_name in (
    'valeur_indice',
    'indice_martinique',
    'indice_france',
    'indice_france_metropolitaine'
)
