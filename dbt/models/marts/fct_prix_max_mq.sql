-- Grain : (carburant_mq, debut_effet).
-- fin_effet_exclusive = lead(debut_effet) ; NULL pour la dernière période ouverte.

with source as (
    select * from {{ ref("stg_arretes") }}
),

periode as (
    select
        carburant_mq,
        debut_effet,
        libelle_source,
        prix_max_eur_litre,
        reference_acte,
        url_source_primaire,
        pages_acte,
        lead(debut_effet) over (
            partition by carburant_mq
            order by debut_effet
        ) as fin_effet_exclusive
    from source
)

select
    carburant_mq,
    debut_effet,
    fin_effet_exclusive,
    libelle_source,
    prix_max_eur_litre,
    reference_acte,
    url_source_primaire,
    pages_acte
from periode
