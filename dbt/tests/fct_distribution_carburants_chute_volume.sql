-- Chute de volumétrie > 30 % entre deux mois complets consécutifs.

with ordonne as (
    select
        mois,
        carburant_national,
        nombre_stations,
        mois_complet,
        lag(nombre_stations) over (
            partition by carburant_national
            order by mois
        ) as stations_mois_precedent,
        lag(mois_complet) over (
            partition by carburant_national
            order by mois
        ) as precedent_complet
    from {{ ref("fct_distribution_carburants_metropole") }}
)

select *
from ordonne
where mois_complet
  and precedent_complet
  and stations_mois_precedent is not null
  and nombre_stations::double < 0.7 * stations_mois_precedent::double
