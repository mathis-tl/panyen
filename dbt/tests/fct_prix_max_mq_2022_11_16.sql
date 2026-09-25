-- La date d'effet 2022-11-16 doit exister pour chaque carburant du seed.

select distinct carburant_mq
from {{ ref("fct_prix_max_mq") }} as tous
where not exists (
    select 1
    from {{ ref("fct_prix_max_mq") }} as cible
    where cible.carburant_mq = tous.carburant_mq
      and cible.debut_effet = date '2022-11-16'
)
