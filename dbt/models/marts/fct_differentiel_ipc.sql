-- Grain : une ligne par (poste, periode).
-- Apparie les facteurs d'évolution déjà rebasés intra-territoire et
-- intra-poste, puis joint l'ancre ECSP 2022 de l'alimentation
-- (seed ecsp_alimentation_2022) et de l'ensemble (seed ecsp_niveaux,
-- annee_enquete = 2022, poste = 'ensemble'). Aucun niveau d'indice brut
-- n'est exposé ni comparé. Aucune ancre ECSP n'est inventée pour les
-- autres postes.

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
            ('services', 'Services'),
            ('ensemble', 'Ensemble')
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
),

ancres as (
    select
        ecsp_alimentation_2022.poste,
        ecsp_alimentation_2022.ecart_fisher_pct,
        ecsp_alimentation_2022.source_ecsp,
        ecsp_alimentation_2022.periode_ancrage
    from {{ ref("ecsp_alimentation_2022") }} as ecsp_alimentation_2022
    where ecsp_alimentation_2022.poste = 'alimentation'
        and ecsp_alimentation_2022.territoire_compare = 'D972'
        and ecsp_alimentation_2022.territoire_reference = 'FM'

    union all

    select
        ecsp_niveaux.poste,
        ecsp_niveaux.ecart_fisher_pct,
        ecsp_niveaux.source_url as source_ecsp,
        date '2022-04-01' as periode_ancrage
    from {{ ref("ecsp_niveaux") }} as ecsp_niveaux
    where ecsp_niveaux.annee_enquete = 2022
        and ecsp_niveaux.poste = 'ensemble'
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
    ancres.ecart_fisher_pct is not null as ancre_ecsp_disponible,
    ancres.ecart_fisher_pct as ecart_ecsp_2022_pct,
    case
        when ancres.ecart_fisher_pct is null then null
        else (
            (
                1 + ancres.ecart_fisher_pct / 100
            ) * apparie.coefficient_ecart
            - 1
        ) * 100
    end as ecart_prix_estime_pct,
    ancres.source_ecsp,
    case
        when ancres.ecart_fisher_pct is null then null
        when apparie.periode = ancres.periode_ancrage
            then 'mesure_ecsp_2022'
        when apparie.periode > ancres.periode_ancrage
            then 'estimation_a_partir_ecsp_2022'
    end as nature_ecart
from apparie
left join ancres
    on apparie.poste = ancres.poste
order by apparie.poste, apparie.periode
