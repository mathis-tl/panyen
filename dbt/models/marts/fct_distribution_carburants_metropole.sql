-- Grain : (mois, carburant_national).
-- Quantiles empiriques des prix de station du mois ; septembre 2026 est le
-- seul mois incomplet autorisé de ce lot.

with base as (
    select
        mois,
        carburant_national,
        prix_eur_litre,
        collecte_utc
    from {{ ref("int_carburant_station_mois") }}
),

agg as (
    select
        mois,
        carburant_national,
        quantile_cont(prix_eur_litre, 0.10) as q10_eur_litre,
        quantile_cont(prix_eur_litre, 0.25) as q25_eur_litre,
        quantile_cont(prix_eur_litre, 0.50) as mediane_eur_litre,
        quantile_cont(prix_eur_litre, 0.75) as q75_eur_litre,
        quantile_cont(prix_eur_litre, 0.90) as q90_eur_litre,
        count(*)::bigint as nombre_stations,
        max(collecte_utc) as collecte_utc_nationale,
        case
            when mois = date '2026-09-01' then false
            else true
        end as mois_complet
    from base
    group by mois, carburant_national
)

select
    mois,
    carburant_national,
    q10_eur_litre,
    q25_eur_litre,
    mediane_eur_litre,
    q75_eur_litre,
    q90_eur_litre,
    nombre_stations,
    mois_complet,
    collecte_utc_nationale
from agg
