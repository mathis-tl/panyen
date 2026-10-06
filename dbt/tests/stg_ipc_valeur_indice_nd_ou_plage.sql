-- Valeur nulle seulement si ND ; sinon l'indice reste dans la plage 50–200,
-- y compris les séries ensemble 011814618 et 011814612.
select
    fichier_source,
    idbank,
    periode,
    valeur_indice,
    statut_observation
from {{ ref("stg_ipc") }}
where not (
    (statut_observation = 'ND' and valeur_indice is null)
    or (
        valeur_indice is not null
        and valeur_indice between 50 and 200
    )
)
