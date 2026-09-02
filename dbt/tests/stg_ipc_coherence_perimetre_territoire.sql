-- Cohérence idbank / code_territoire / perimetre_reference.
select
    fichier_source,
    idbank,
    code_territoire,
    perimetre_reference
from {{ ref("stg_ipc") }}
where not (
    (
        idbank = '011813726'
        and code_territoire = 'D972'
        and perimetre_reference in (
            'france_entiere_historique',
            'france_metropolitaine'
        )
    )
    or (
        idbank = '011813717'
        and code_territoire = 'FE'
        and perimetre_reference = 'france_entiere_historique'
    )
    or (
        idbank = '011813720'
        and code_territoire = 'FM'
        and perimetre_reference = 'france_metropolitaine'
    )
)
