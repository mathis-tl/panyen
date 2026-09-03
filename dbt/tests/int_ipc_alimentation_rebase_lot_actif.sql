-- Le lot aval est unique, métropolitain, le plus récent, sans France entière.
with fichier_attendu as (
    select stg_ipc.fichier_source
    from {{ ref("stg_ipc") }} as stg_ipc
    where stg_ipc.perimetre_reference = 'france_metropolitaine'
    order by stg_ipc.collecte_utc desc, stg_ipc.fichier_source desc
    limit 1
),

observes as (
    select distinct
        int_ipc_alimentation_rebase.fichier_source,
        int_ipc_alimentation_rebase.perimetre_reference,
        int_ipc_alimentation_rebase.idbank,
        int_ipc_alimentation_rebase.code_territoire
    from {{ ref("int_ipc_alimentation_rebase") }} as int_ipc_alimentation_rebase
)

select 'plusieurs_fichiers' as motif
where (
    select count(distinct observes.fichier_source)
    from observes
) != 1

union all

select 'fichier_inattendu' as motif
from observes
where observes.fichier_source != (select fichier_attendu.fichier_source from fichier_attendu)

union all

select 'perimetre_non_metropolitain' as motif
from observes
where observes.perimetre_reference != 'france_metropolitaine'

union all

select 'serie_hors_perimetre' as motif
from observes
where observes.idbank not in ('011813726', '011813720')
   or observes.code_territoire not in ('D972', 'FM')
   or observes.idbank = '011813717'
   or observes.code_territoire = 'FE'
