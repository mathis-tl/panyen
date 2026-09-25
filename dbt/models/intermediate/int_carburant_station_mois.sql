-- Grain : (mois, id_station, carburant_national).
-- Une station ne pèse qu'une fois : dernière déclaration du mois, sans report
-- sur un mois sans déclaration.

with base as (
    select
        date_trunc('month', releve_utc)::date as mois,
        id_station,
        carburant_national,
        releve_utc,
        prix_eur_litre,
        code_postal,
        fichier_source,
        sha256_source,
        collecte_utc
    from {{ ref("fct_carburant_station") }}
),

classe as (
    select
        *,
        row_number() over (
            partition by mois, id_station, carburant_national
            order by releve_utc desc, fichier_source desc
        ) as rang
    from base
)

select
    mois,
    id_station,
    carburant_national,
    releve_utc,
    prix_eur_litre,
    code_postal,
    fichier_source,
    sha256_source,
    collecte_utc
from classe
where rang = 1
