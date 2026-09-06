-- L'ancre existe une fois par série active, avec une valeur strictement
-- positive ; les facteurs d'avril 2022 valent 1.
with ancre as (
    select
        int_ipc_rebase.poste,
        int_ipc_rebase.idbank,
        int_ipc_rebase.code_territoire,
        int_ipc_rebase.valeur_indice,
        int_ipc_rebase.facteur,
        int_ipc_rebase.evolution_pct
    from {{ ref("int_ipc_rebase") }} as int_ipc_rebase
    where int_ipc_rebase.periode = date '2022-04-01'
)

select 'volumetrie_ancre' as motif
where (select count(*) from ancre) != 8
   or (select count(distinct ancre.idbank) from ancre) != 8
   or (select count(distinct ancre.poste) from ancre) != 4

union all

select 'ancre_invalide' as motif
from ancre
where ancre.valeur_indice is null
   or ancre.valeur_indice <= 0
   or ancre.facteur is null
   or abs(ancre.facteur - 1) > 1e-10
   or abs(ancre.evolution_pct) > 1e-10
