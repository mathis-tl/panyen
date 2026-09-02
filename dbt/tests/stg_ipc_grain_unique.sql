-- Grain (fichier_source, idbank, periode) unique dans stg_ipc.
select
    fichier_source,
    idbank,
    periode
from {{ ref("stg_ipc") }}
group by fichier_source, idbank, periode
having count(*) > 1
