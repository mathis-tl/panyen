-- Grain : (debut_effet, carburant_national), aligné sur fct_prix_max_mq (gazole).
-- Quantiles empiriques des moyennes pondérées par station ; mois_complet =
-- période d'effet close (fin_effet_exclusive renseignée).

with periodes as (
    select
        carburant_mq,
        debut_effet,
        fin_effet_exclusive
    from {{ ref("fct_prix_max_mq") }}
    where carburant_mq = 'gazole'
),

base as (
    select
        s.debut_effet,
        s.carburant_national,
        s.prix_eur_litre,
        s.collecte_utc
    from {{ ref("int_carburant_station_periode") }} as s
),

agg as (
    select
        b.debut_effet,
        b.carburant_national,
        quantile_cont(b.prix_eur_litre, 0.10) as q10_eur_litre,
        quantile_cont(b.prix_eur_litre, 0.25) as q25_eur_litre,
        quantile_cont(b.prix_eur_litre, 0.50) as mediane_eur_litre,
        quantile_cont(b.prix_eur_litre, 0.75) as q75_eur_litre,
        quantile_cont(b.prix_eur_litre, 0.90) as q90_eur_litre,
        count(*)::bigint as nombre_stations,
        max(b.collecte_utc) as collecte_utc_nationale,
        p.fin_effet_exclusive is not null as mois_complet
    from base as b
    inner join periodes as p
        on p.debut_effet = b.debut_effet
    group by b.debut_effet, b.carburant_national, p.fin_effet_exclusive
)

select
    debut_effet as mois,
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
