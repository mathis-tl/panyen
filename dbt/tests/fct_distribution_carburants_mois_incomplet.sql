-- Septembre 2026 est le seul mois incomplet autorisé.

select *
from {{ ref("fct_distribution_carburants_metropole") }}
where not mois_complet
  and mois <> date '2026-09-01'
