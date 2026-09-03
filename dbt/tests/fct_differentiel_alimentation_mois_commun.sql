-- Le dernier mois de la fact table est exactement dernier_mois_commun.
-- On n'exige pas que les deux séries source finissent au même mois.
with facture as (
    select
        fct_differentiel_alimentation.periode,
        fct_differentiel_alimentation.dernier_mois_commun
    from {{ ref("fct_differentiel_alimentation") }} as fct_differentiel_alimentation
)

select 'dernier_mois_incoherent' as motif
from facture
where facture.dernier_mois_commun != (
    select max(facture.periode) from facture
)
   or facture.periode > facture.dernier_mois_commun

union all

select 'dernier_mois_non_constant' as motif
where (
    select min(facture.dernier_mois_commun) from facture
) != (
    select max(facture.dernier_mois_commun) from facture
)
