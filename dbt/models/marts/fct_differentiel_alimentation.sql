-- Grain : une ligne par mois commun.
-- Apparie les facteurs d'évolution déjà rebasés intra-territoire, puis joint
-- la mesure ECSP 2022. Aucun niveau d'indice brut n'est exposé ni comparé.

with martinique as (
    select
        int_ipc_alimentation_rebase.fichier_source,
        int_ipc_alimentation_rebase.collecte_utc,
        int_ipc_alimentation_rebase.periode,
        int_ipc_alimentation_rebase.dernier_mois_commun,
        int_ipc_alimentation_rebase.idbank,
        int_ipc_alimentation_rebase.facteur,
        int_ipc_alimentation_rebase.evolution_pct
    from {{ ref("int_ipc_alimentation_rebase") }} as int_ipc_alimentation_rebase
    where int_ipc_alimentation_rebase.idbank = '011813726'
      and int_ipc_alimentation_rebase.code_territoire = 'D972'
),

france_metropolitaine as (
    select
        int_ipc_alimentation_rebase.periode,
        int_ipc_alimentation_rebase.idbank,
        int_ipc_alimentation_rebase.facteur,
        int_ipc_alimentation_rebase.evolution_pct
    from {{ ref("int_ipc_alimentation_rebase") }} as int_ipc_alimentation_rebase
    where int_ipc_alimentation_rebase.idbank = '011813720'
      and int_ipc_alimentation_rebase.code_territoire = 'FM'
)

select
    martinique.periode,
    martinique.dernier_mois_commun,
    ecsp_alimentation_2022.poste,
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
        / france_metropolitaine.facteur as coefficient_ecart,
    ecsp_alimentation_2022.ecart_fisher_pct as ecart_ecsp_2022_pct,
    (
        (
            1 + ecsp_alimentation_2022.ecart_fisher_pct / 100
        ) * (martinique.facteur / france_metropolitaine.facteur)
        - 1
    ) * 100 as ecart_prix_estime_pct,
    ecsp_alimentation_2022.source_ecsp,
    case
        when martinique.periode = ecsp_alimentation_2022.periode_ancrage
            then 'mesure_ecsp_2022'
        when martinique.periode > ecsp_alimentation_2022.periode_ancrage
            then 'estimation_a_partir_ecsp_2022'
    end as nature_ecart
from martinique
inner join france_metropolitaine
    on martinique.periode = france_metropolitaine.periode
inner join {{ ref("ecsp_alimentation_2022") }} as ecsp_alimentation_2022
    on ecsp_alimentation_2022.poste = 'alimentation'
    and ecsp_alimentation_2022.territoire_compare = 'D972'
    and ecsp_alimentation_2022.territoire_reference = 'FM'
    and ecsp_alimentation_2022.periode_ancrage = date '2022-04-01'
order by martinique.periode
