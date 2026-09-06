-- Grain : une ligne par (poste, periode).
-- Apparie les facteurs d'évolution déjà rebasés intra-territoire et
-- intra-poste, puis joint éventuellement la mesure ECSP 2022 (alimentation
-- seulement). Aucun niveau d'indice brut n'est exposé ni comparé. Aucune ancre
-- ECSP n'est inventée hors alimentation.

with rebase as (
    select
        int_ipc_rebase.fichier_source,
        int_ipc_rebase.collecte_utc,
        int_ipc_rebase.poste,
        int_ipc_rebase.idbank,
        int_ipc_rebase.code_territoire,
        int_ipc_rebase.periode,
        int_ipc_rebase.dernier_mois_commun,
        int_ipc_rebase.facteur,
        int_ipc_rebase.evolution_pct
    from {{ ref("int_ipc_rebase") }} as int_ipc_rebase
),

martinique as (
    select *
    from rebase
    where rebase.code_territoire = 'D972'
),

france_metropolitaine as (
    select *
    from rebase
    where rebase.code_territoire = 'FM'
),

libelles as (
    select
        libelle.poste,
        libelle.libelle_poste
    from (
        values
            ('alimentation', 'Alimentation'),
            ('energie', 'Énergie'),
            ('produits_manufactures', 'Produits manufacturés'),
            ('services', 'Services')
    ) as libelle(poste, libelle_poste)
),

apparie as (
    select
        martinique.periode,
        martinique.dernier_mois_commun,
        martinique.poste,
        libelles.libelle_poste,
        martinique.fichier_source,
        martinique.collecte_utc,
        martinique.idbank as idbank_martinique,
        france_metropolitaine.idbank as idbank_france_metropolitaine,
        martinique.facteur as facteur_martinique,
        france_metropolitaine.facteur as facteur_france_metropolitaine,
        martinique.evolution_pct as evolution_martinique_pct,
        france_metropolitaine.evolution_pct as evolution_france_metropolitaine_pct,
        martinique.evolution_pct
            - france_metropolitaine.evolution_pct as differentiel_evolution_points,
        martinique.facteur
            / france_metropolitaine.facteur as coefficient_ecart
    from martinique
    inner join france_metropolitaine
        on martinique.periode = france_metropolitaine.periode
        and martinique.poste = france_metropolitaine.poste
    inner join libelles
        on martinique.poste = libelles.poste
)

select
    apparie.periode,
    apparie.dernier_mois_commun,
    apparie.poste,
    apparie.libelle_poste,
    apparie.fichier_source,
    apparie.collecte_utc,
    apparie.idbank_martinique,
    apparie.idbank_france_metropolitaine,
    apparie.facteur_martinique,
    apparie.facteur_france_metropolitaine,
    apparie.evolution_martinique_pct,
    apparie.evolution_france_metropolitaine_pct,
    apparie.differentiel_evolution_points,
    apparie.coefficient_ecart,
    ecsp_alimentation_2022.ecart_fisher_pct is not null as ancre_ecsp_disponible,
    ecsp_alimentation_2022.ecart_fisher_pct as ecart_ecsp_2022_pct,
    case
        when ecsp_alimentation_2022.ecart_fisher_pct is null then null
        else (
            (
                1 + ecsp_alimentation_2022.ecart_fisher_pct / 100
            ) * apparie.coefficient_ecart
            - 1
        ) * 100
    end as ecart_prix_estime_pct,
    ecsp_alimentation_2022.source_ecsp,
    case
        when ecsp_alimentation_2022.ecart_fisher_pct is null then null
        when apparie.periode = ecsp_alimentation_2022.periode_ancrage
            then 'mesure_ecsp_2022'
        when apparie.periode > ecsp_alimentation_2022.periode_ancrage
            then 'estimation_a_partir_ecsp_2022'
    end as nature_ecart
from apparie
left join {{ ref("ecsp_alimentation_2022") }} as ecsp_alimentation_2022
    on apparie.poste = 'alimentation'
    and ecsp_alimentation_2022.poste = 'alimentation'
    and ecsp_alimentation_2022.territoire_compare = 'D972'
    and ecsp_alimentation_2022.territoire_reference = 'FM'
    and ecsp_alimentation_2022.periode_ancrage = date '2022-04-01'
order by apparie.poste, apparie.periode
