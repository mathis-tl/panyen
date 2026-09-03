-- nature_ecart n'accepte que les deux libellés, mesure uniquement à l'ancre.
with facture as (
    select
        fct_differentiel_alimentation.periode,
        fct_differentiel_alimentation.nature_ecart
    from {{ ref("fct_differentiel_alimentation") }} as fct_differentiel_alimentation
),

ecsp as (
    select ecsp_alimentation_2022.periode_ancrage
    from {{ ref("ecsp_alimentation_2022") }} as ecsp_alimentation_2022
)

select
    facture.periode,
    facture.nature_ecart
from facture
cross join ecsp
where facture.nature_ecart not in (
    'mesure_ecsp_2022',
    'estimation_a_partir_ecsp_2022'
)
   or (
       facture.periode = ecsp.periode_ancrage
       and facture.nature_ecart != 'mesure_ecsp_2022'
   )
   or (
       facture.periode > ecsp.periode_ancrage
       and facture.nature_ecart != 'estimation_a_partir_ecsp_2022'
   )
   or facture.periode < ecsp.periode_ancrage
