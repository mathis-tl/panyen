-- Seule une période ouverte (sans fin d'effet) peut être incomplète.

select d.*
from {{ ref("fct_distribution_carburants_metropole") }} as d
inner join {{ ref("fct_prix_max_mq") }} as p
    on p.debut_effet = d.mois
    and p.carburant_mq = 'gazole'
where not d.mois_complet
  and p.fin_effet_exclusive is not null
