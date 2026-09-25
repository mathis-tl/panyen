-- Grain : (type_ligne, carburant, date_reference).
-- Union de publication limitée aux correspondances directe.
-- Nullabilité discriminée par type_ligne.

with correspondances as (
    select
        carburant_mq,
        libelle_mq,
        carburant_national,
        libelle_national,
        statut_comparabilite
    from {{ ref("stg_correspondance_carburants") }}
    where statut_comparabilite = 'directe'
),

distribution as (
    select
        'distribution_metropole'::varchar as type_ligne,
        dist.carburant_national as carburant,
        corr.libelle_national as libelle_carburant,
        dist.mois as date_reference,
        dist.mois_complet,
        dist.q10_eur_litre,
        dist.q25_eur_litre,
        dist.mediane_eur_litre,
        dist.q75_eur_litre,
        dist.q90_eur_litre,
        dist.nombre_stations,
        null::decimal(12, 4) as prix_max_mq_eur_litre,
        null::date as fin_effet_exclusive,
        null::varchar as reference_acte,
        null::varchar as url_source_primaire,
        dist.collecte_utc_nationale
    from {{ ref("fct_distribution_carburants_metropole") }} as dist
    inner join correspondances as corr
        on dist.carburant_national = corr.carburant_national
),

plafonds as (
    select
        'plafond_martinique'::varchar as type_ligne,
        prix.carburant_mq as carburant,
        corr.libelle_mq as libelle_carburant,
        prix.debut_effet as date_reference,
        null::boolean as mois_complet,
        null::decimal(12, 4) as q10_eur_litre,
        null::decimal(12, 4) as q25_eur_litre,
        null::decimal(12, 4) as mediane_eur_litre,
        null::decimal(12, 4) as q75_eur_litre,
        null::decimal(12, 4) as q90_eur_litre,
        null::bigint as nombre_stations,
        prix.prix_max_eur_litre as prix_max_mq_eur_litre,
        prix.fin_effet_exclusive,
        prix.reference_acte,
        prix.url_source_primaire,
        null::timestamptz as collecte_utc_nationale
    from {{ ref("fct_prix_max_mq") }} as prix
    inner join correspondances as corr
        on prix.carburant_mq = corr.carburant_mq
)

select
    type_ligne,
    carburant,
    libelle_carburant,
    date_reference,
    mois_complet,
    q10_eur_litre,
    q25_eur_litre,
    mediane_eur_litre,
    q75_eur_litre,
    q90_eur_litre,
    nombre_stations,
    prix_max_mq_eur_litre,
    fin_effet_exclusive,
    reference_acte,
    url_source_primaire,
    collecte_utc_nationale
from distribution

union all

select
    type_ligne,
    carburant,
    libelle_carburant,
    date_reference,
    mois_complet,
    q10_eur_litre,
    q25_eur_litre,
    mediane_eur_litre,
    q75_eur_litre,
    q90_eur_litre,
    nombre_stations,
    prix_max_mq_eur_litre,
    fin_effet_exclusive,
    reference_acte,
    url_source_primaire,
    collecte_utc_nationale
from plafonds
