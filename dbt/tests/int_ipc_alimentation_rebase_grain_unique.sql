-- Grain (fichier_source, idbank, periode) unique dans le rebasage.
select
    fichier_source,
    idbank,
    periode
from {{ ref("int_ipc_alimentation_rebase") }}
group by fichier_source, idbank, periode
having count(*) > 1
