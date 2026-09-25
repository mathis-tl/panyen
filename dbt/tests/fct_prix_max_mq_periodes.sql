-- Périodes non chevauchantes ; seule la dernière peut avoir fin NULL.

with verif as (
    select
        carburant_mq,
        debut_effet,
        fin_effet_exclusive,
        lead(debut_effet) over (
            partition by carburant_mq
            order by debut_effet
        ) as debut_suivant
    from {{ ref("fct_prix_max_mq") }}
)

select *
from verif
where (fin_effet_exclusive is null and debut_suivant is not null)
   or (fin_effet_exclusive is not null and debut_suivant is null)
   or (fin_effet_exclusive is not null and debut_suivant is not null
       and fin_effet_exclusive <> debut_suivant)
   or (fin_effet_exclusive is not null and fin_effet_exclusive <= debut_effet)
