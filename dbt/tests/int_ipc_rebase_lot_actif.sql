-- Le lot aval est unique, quatre postes, le plus récent ; jamais un repli
-- sur un ancien lot alimentaire.
with fichier_attendu as (
    select stg_ipc.fichier_source
    from {{ ref("stg_ipc") }} as stg_ipc
    where stg_ipc.lot_collecte = 'quatre_postes_france_metropolitaine'
    order by stg_ipc.collecte_utc desc, stg_ipc.fichier_source desc
    limit 1
),

observes as (
    select distinct
        int_ipc_rebase.fichier_source,
        int_ipc_rebase.lot_collecte,
        int_ipc_rebase.perimetre_reference,
        int_ipc_rebase.poste,
        int_ipc_rebase.idbank,
        int_ipc_rebase.code_territoire
    from {{ ref("int_ipc_rebase") }} as int_ipc_rebase
)

select 'aucun_lot_actif' as motif
where (select count(*) from fichier_attendu) != 1
   or (select count(*) from observes) = 0

union all

select 'plusieurs_fichiers' as motif
where (
    select count(distinct observes.fichier_source)
    from observes
) != 1

union all

select 'fichier_inattendu' as motif
from observes
where observes.fichier_source != (
    select fichier_attendu.fichier_source from fichier_attendu
)

union all

select 'lot_non_quatre_postes' as motif
from observes
where observes.lot_collecte != 'quatre_postes_france_metropolitaine'
   or observes.perimetre_reference != 'france_metropolitaine'

union all

select 'serie_hors_referentiel' as motif
from observes
where observes.code_territoire not in ('D972', 'FM')
   or observes.idbank = '011813717'
   or observes.code_territoire = 'FE'
