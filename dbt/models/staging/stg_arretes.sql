-- Grain : (carburant_mq, debut_effet).
-- Seed réglementaire transcrit des actes primaires ; aucun gaz en bouteille.

select
    debut_effet::date as debut_effet,
    carburant_mq,
    libelle_source,
    prix_max_eur_litre::decimal(12, 4) as prix_max_eur_litre,
    reference_acte,
    url_source_primaire,
    pages_acte
from {{ ref("prix_max_carburants_martinique") }}
