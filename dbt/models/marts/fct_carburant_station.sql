-- Grain : (id_station, carburant_national, releve_utc).
-- Déduplication déterministe des archives collectées : même grain et même
-- prix → une ligne ; deux prix différents au même grain = échec (test dédié).

with source as (
    select * from {{ ref("stg_carburants") }}
),

-- Collapse les balises <prix> dupliquées dans un même membre XML avant
-- la déduplication inter-archives.
source_membre as (
    select
        id_station,
        carburant_national,
        releve_utc,
        fichier_source,
        membre_zip,
        min(code_postal) as code_postal,
        min(commune) as commune,
        min(latitude) as latitude,
        min(longitude) as longitude,
        min(id_carburant) as id_carburant,
        max(prix_eur_litre) as prix_eur_litre,
        min(sha256_source) as sha256_source,
        min(collecte_utc) as collecte_utc
    from source
    group by
        id_station,
        carburant_national,
        releve_utc,
        fichier_source,
        membre_zip
),

dedup as (
    select
        id_station,
        carburant_national,
        releve_utc,
        min(code_postal) as code_postal,
        min(commune) as commune,
        min(latitude) as latitude,
        min(longitude) as longitude,
        min(id_carburant) as id_carburant,
        min(prix_eur_litre) as prix_eur_litre,
        min(fichier_source) as fichier_source,
        min(sha256_source) as sha256_source,
        min(collecte_utc) as collecte_utc,
        min(membre_zip) as membre_zip,
        count(distinct prix_eur_litre) as n_prix_distincts
    from source_membre
    group by id_station, carburant_national, releve_utc
)

select
    id_station,
    carburant_national,
    releve_utc,
    code_postal,
    commune,
    latitude,
    longitude,
    id_carburant,
    prix_eur_litre,
    fichier_source,
    sha256_source,
    collecte_utc,
    membre_zip,
    n_prix_distincts
from dedup
