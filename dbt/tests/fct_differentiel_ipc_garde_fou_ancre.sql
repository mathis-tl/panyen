-- Garde-fou d'ancre : ancre_ecsp_disponible vrai exactement pour
-- l'alimentation ; les quatre colonnes ECSP toutes non nulles quand vrai,
-- toutes nulles quand faux. Aucun état mixte.
with facture as (
    select
        poste,
        ancre_ecsp_disponible,
        ecart_ecsp_2022_pct,
        ecart_prix_estime_pct,
        source_ecsp,
        nature_ecart
    from {{ ref("fct_differentiel_ipc") }}
)

select 'ancre_hors_alimentation' as motif
from facture
where facture.poste != 'alimentation'
  and facture.ancre_ecsp_disponible

union all

select 'alimentation_sans_ancre' as motif
from facture
where facture.poste = 'alimentation'
  and not facture.ancre_ecsp_disponible

union all

select 'ecsp_mixte_ou_incomplet' as motif
from facture
where facture.ancre_ecsp_disponible
  and (
      facture.ecart_ecsp_2022_pct is null
      or facture.ecart_prix_estime_pct is null
      or facture.source_ecsp is null
      or facture.nature_ecart is null
  )

union all

select 'ecsp_non_nul_sans_ancre' as motif
from facture
where not facture.ancre_ecsp_disponible
  and (
      facture.ecart_ecsp_2022_pct is not null
      or facture.ecart_prix_estime_pct is not null
      or facture.source_ecsp is not null
      or facture.nature_ecart is not null
  )
