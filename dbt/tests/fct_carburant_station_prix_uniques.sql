-- Échec si deux prix distincts partagent le même grain station/carburant/relevé.

select *
from {{ ref("fct_carburant_station") }}
where n_prix_distincts > 1
