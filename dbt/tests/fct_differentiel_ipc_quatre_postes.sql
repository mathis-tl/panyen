-- Exactement cinq postes, chacun couvrant le même ensemble de périodes.
-- Le poste ensemble finit sur le même mois commun que les autres.
with par_poste as (
    select
        poste,
        count(*) as n_lignes,
        min(periode) as periode_min,
        max(periode) as periode_max,
        list_sort(list(periode)) as periodes
    from {{ ref("fct_differentiel_ipc") }}
    group by poste
),

reference as (
    select periodes, periode_max
    from par_poste
    where poste = 'alimentation'
)

select 'volumetrie_postes' as motif
where (select count(*) from par_poste) != 5
   or (
        select count(*) from par_poste
        where poste in (
            'alimentation',
            'energie',
            'produits_manufactures',
            'services',
            'ensemble'
        )
   ) != 5

union all

select 'periodes_desalignees' as motif
from par_poste
cross join reference
where par_poste.periodes != reference.periodes
   or par_poste.periode_min != date '2022-04-01'

union all

select 'ensemble_hors_mois_commun' as motif
from par_poste
cross join reference
where par_poste.poste = 'ensemble'
  and (
      par_poste.periode_max != reference.periode_max
      or par_poste.periodes != reference.periodes
  )

