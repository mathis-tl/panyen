-- L'ancre existe une fois par territoire, avec une valeur strictement
-- positive ; les facteurs d'avril 2022 valent 1.
with ancre as (
    select
        int_ipc_alimentation_rebase.idbank,
        int_ipc_alimentation_rebase.code_territoire,
        int_ipc_alimentation_rebase.valeur_indice,
        int_ipc_alimentation_rebase.facteur,
        int_ipc_alimentation_rebase.evolution_pct
    from {{ ref("int_ipc_alimentation_rebase") }} as int_ipc_alimentation_rebase
    where int_ipc_alimentation_rebase.periode = date '2022-04-01'
)

select 'volumetrie_ancre' as motif
where (select count(*) from ancre) != 2
   or (select count(distinct ancre.idbank) from ancre) != 2

union all

select 'ancre_invalide' as motif
from ancre
where ancre.valeur_indice is null
   or ancre.valeur_indice <= 0
   or ancre.facteur is null
   or abs(ancre.facteur - 1) > 1e-10
   or abs(ancre.evolution_pct) > 1e-10
   or ancre.idbank not in ('011813726', '011813720')
