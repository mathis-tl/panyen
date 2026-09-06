-- Identités arithmétiques recalculées en SQL, tolérance 1e-9.
-- ecart_prix_estime_pct seulement là où l'ancre existe.
with facture as (
    select
        periode,
        poste,
        ancre_ecsp_disponible,
        facteur_martinique,
        facteur_france_metropolitaine,
        evolution_martinique_pct,
        evolution_france_metropolitaine_pct,
        differentiel_evolution_points,
        coefficient_ecart,
        ecart_ecsp_2022_pct,
        ecart_prix_estime_pct,
        nature_ecart,
        source_ecsp
    from {{ ref("fct_differentiel_ipc") }}
),

ecsp as (
    select
        ecsp_alimentation_2022.ecart_fisher_pct,
        ecsp_alimentation_2022.periode_ancrage,
        ecsp_alimentation_2022.source_ecsp
    from {{ ref("ecsp_alimentation_2022") }} as ecsp_alimentation_2022
)

select 'formules_communes' as motif
from facture
where abs(
        facture.differentiel_evolution_points
        - (
            facture.evolution_martinique_pct
            - facture.evolution_france_metropolitaine_pct
        )
    ) > 1e-9
   or abs(
        facture.coefficient_ecart
        - (
            facture.facteur_martinique
            / facture.facteur_france_metropolitaine
        )
    ) > 1e-9

union all

select 'formules_ecsp' as motif
from facture
cross join ecsp
where facture.ancre_ecsp_disponible
  and (
      abs(
          facture.ecart_prix_estime_pct
          - (
              (
                  1 + facture.ecart_ecsp_2022_pct / 100
              ) * facture.coefficient_ecart
              - 1
          ) * 100
      ) > 1e-9
      or abs(facture.ecart_ecsp_2022_pct - ecsp.ecart_fisher_pct) > 1e-9
      or facture.source_ecsp != ecsp.source_ecsp
  )

union all

select 'ancre_alimentation' as motif
from facture
cross join ecsp
where facture.poste = 'alimentation'
  and facture.periode = ecsp.periode_ancrage
  and (
      abs(facture.facteur_martinique - 1) > 1e-9
      or abs(facture.facteur_france_metropolitaine - 1) > 1e-9
      or abs(facture.evolution_martinique_pct) > 1e-9
      or abs(facture.evolution_france_metropolitaine_pct) > 1e-9
      or abs(facture.differentiel_evolution_points) > 1e-9
      or abs(facture.coefficient_ecart - 1) > 1e-9
      or abs(facture.ecart_prix_estime_pct - ecsp.ecart_fisher_pct) > 1e-9
      or facture.nature_ecart != 'mesure_ecsp_2022'
  )
