-- Exactement quatre postes, chacun couvrant le même ensemble de périodes.
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
    select periodes
    from par_poste
    where poste = 'alimentation'
)

select 'volumetrie_postes' as motif
where (select count(*) from par_poste) != 4
   or (
        select count(*) from par_poste
        where poste in (
            'alimentation', 'energie', 'produits_manufactures', 'services'
        )
   ) != 4

union all

select 'periodes_desalignees' as motif
from par_poste
cross join reference
where par_poste.periodes != reference.periodes
   or par_poste.periode_min != date '2022-04-01'
