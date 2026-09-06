-- Chaque fichier_source porte exactement l'ensemble d'idbanks imposé par
-- son lot_collecte, ni plus, ni moins.
with par_fichier as (
    select
        fichier_source,
        min(lot_collecte) as lot_collecte,
        count(distinct lot_collecte) as n_lots,
        bool_or(idbank = '011813726') as a_726,
        bool_or(idbank = '011813717') as a_717,
        bool_or(idbank = '011813720') as a_720,
        bool_or(idbank = '011813873') as a_873,
        bool_or(idbank = '011813867') as a_867,
        bool_or(idbank = '011813789') as a_789,
        bool_or(idbank = '011813783') as a_783,
        bool_or(idbank = '011813915') as a_915,
        bool_or(idbank = '011813909') as a_909,
        count(distinct idbank) as n_idbanks
    from {{ ref("stg_ipc") }}
    group by fichier_source
)
select fichier_source
from par_fichier
where n_lots != 1
   or not (
        (
            lot_collecte = 'alimentation_france_entiere'
            and n_idbanks = 2
            and a_726 and a_717
            and not a_720 and not a_873 and not a_867
            and not a_789 and not a_783 and not a_915 and not a_909
        )
        or (
            lot_collecte = 'alimentation_france_metropolitaine'
            and n_idbanks = 2
            and a_726 and a_720
            and not a_717 and not a_873 and not a_867
            and not a_789 and not a_783 and not a_915 and not a_909
        )
        or (
            lot_collecte = 'quatre_postes_france_metropolitaine'
            and n_idbanks = 8
            and a_726 and a_720 and a_873 and a_867
            and a_789 and a_783 and a_915 and a_909
            and not a_717
        )
    )
