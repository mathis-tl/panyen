-- Valeur nulle seulement si ND ; sinon l'indice reste dans la plage 50–200.
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
