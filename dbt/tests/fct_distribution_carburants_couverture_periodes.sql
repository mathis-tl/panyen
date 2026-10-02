-- Chaque période d'effet du plafond martiniquais (gazole) doit avoir une ligne
-- de distribution métropolitaine : une période sans donnée nationale fait
-- échouer, elle ne disparaît pas. Les lignes retournées sont les périodes manquantes.

select p.debut_effet
from {{ ref("fct_prix_max_mq") }} as p
left join {{ ref("fct_distribution_carburants_metropole") }} as d
    on d.mois = p.debut_effet
where p.carburant_mq = 'gazole'
  and d.mois is null
