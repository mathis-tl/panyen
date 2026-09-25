-- Un mois complet sans station est interdit.

select *
from {{ ref("fct_distribution_carburants_metropole") }}
where mois_complet
  and nombre_stations < 1
