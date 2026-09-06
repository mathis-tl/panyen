-- nature_ecart : mesure uniquement à l'ancre pour l'alimentation ;
-- estimation ensuite ; NULL hors alimentation.
with facture as (
    select
        periode,
        poste,
        nature_ecart
    from {{ ref("fct_differentiel_ipc") }}
),

ecsp as (
    select ecsp_alimentation_2022.periode_ancrage
    from {{ ref("ecsp_alimentation_2022") }} as ecsp_alimentation_2022
)

select
    facture.periode,
    facture.poste,
    facture.nature_ecart
from facture
cross join ecsp
where (
    facture.poste = 'alimentation'
    and (
        facture.nature_ecart not in (
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
    )
)
   or (
       facture.poste != 'alimentation'
       and facture.nature_ecart is not null
   )
