-- dernier_mois_commun unique et égal au max(periode) de chaque poste.
with facture as (
    select
        poste,
        periode,
        dernier_mois_commun
    from {{ ref("fct_differentiel_ipc") }}
),

par_poste as (
    select
        poste,
        max(periode) as max_periode,
        min(dernier_mois_commun) as dmc_min,
        max(dernier_mois_commun) as dmc_max
    from facture
    group by poste
)

select 'dernier_mois_non_unique' as motif
where (
    select min(dernier_mois_commun) from facture
) != (
    select max(dernier_mois_commun) from facture
)

union all

select 'dernier_mois_incoherent' as motif
from par_poste
where par_poste.dmc_min != par_poste.dmc_max
   or par_poste.max_periode != par_poste.dmc_min

union all

select 'periode_au_dela' as motif
from facture
where facture.periode > facture.dernier_mois_commun
