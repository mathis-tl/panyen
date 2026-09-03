-- Identités de l'ancre et formules finales, tolérance 1e-10, sans arrondi.
with facture as (
    select
        fct_differentiel_alimentation.periode,
        fct_differentiel_alimentation.facteur_martinique,
        fct_differentiel_alimentation.facteur_france_metropolitaine,
        fct_differentiel_alimentation.evolution_martinique_pct,
        fct_differentiel_alimentation.evolution_france_metropolitaine_pct,
        fct_differentiel_alimentation.differentiel_evolution_points,
        fct_differentiel_alimentation.coefficient_ecart,
        fct_differentiel_alimentation.ecart_ecsp_2022_pct,
        fct_differentiel_alimentation.ecart_prix_estime_pct,
        fct_differentiel_alimentation.nature_ecart,
        fct_differentiel_alimentation.source_ecsp
    from {{ ref("fct_differentiel_alimentation") }} as fct_differentiel_alimentation
),

ecsp as (
    select
        ecsp_alimentation_2022.ecart_fisher_pct,
        ecsp_alimentation_2022.periode_ancrage,
        ecsp_alimentation_2022.source_ecsp
    from {{ ref("ecsp_alimentation_2022") }} as ecsp_alimentation_2022
)

select 'formules' as motif
from facture
cross join ecsp
where abs(
        facture.differentiel_evolution_points
        - (
            facture.evolution_martinique_pct
            - facture.evolution_france_metropolitaine_pct
        )
    ) > 1e-10
   or abs(
        facture.coefficient_ecart
        - (
            facture.facteur_martinique
            / facture.facteur_france_metropolitaine
        )
    ) > 1e-10
   or abs(
        facture.ecart_prix_estime_pct
        - (
            (
                1 + facture.ecart_ecsp_2022_pct / 100
            ) * facture.coefficient_ecart
            - 1
        ) * 100
    ) > 1e-10
   or abs(facture.ecart_ecsp_2022_pct - ecsp.ecart_fisher_pct) > 1e-10
   or facture.source_ecsp != ecsp.source_ecsp

union all

select 'ancre' as motif
from facture
cross join ecsp
where facture.periode = ecsp.periode_ancrage
  and (
      abs(facture.facteur_martinique - 1) > 1e-10
      or abs(facture.facteur_france_metropolitaine - 1) > 1e-10
      or abs(facture.evolution_martinique_pct) > 1e-10
      or abs(facture.evolution_france_metropolitaine_pct) > 1e-10
      or abs(facture.differentiel_evolution_points) > 1e-10
      or abs(facture.coefficient_ecart - 1) > 1e-10
      or abs(facture.ecart_prix_estime_pct - ecsp.ecart_fisher_pct) > 1e-10
      or facture.nature_ecart != 'mesure_ecsp_2022'
  )
