-- Chaque fichier brut porte exactement une des deux paires autorisées,
-- avec le périmètre qui lui correspond :
-- {011813726, 011813717} → france_entiere_historique
-- {011813726, 011813720} → france_metropolitaine
with par_fichier as (
    select
        fichier_source,
        bool_or(idbank = '011813726') as a_726,
        bool_or(idbank = '011813717') as a_717,
        bool_or(idbank = '011813720') as a_720,
        count(distinct idbank) as n_idbanks,
        count(distinct perimetre_reference) as n_perimetres,
        min(perimetre_reference) as perimetre
    from {{ ref("stg_ipc") }}
    group by fichier_source
)
select fichier_source
from par_fichier
where not (
    (
        n_idbanks = 2
        and a_726
        and a_717
        and not a_720
        and n_perimetres = 1
        and perimetre = 'france_entiere_historique'
    )
    or (
        n_idbanks = 2
        and a_726
        and a_720
        and not a_717
        and n_perimetres = 1
        and perimetre = 'france_metropolitaine'
    )
)
