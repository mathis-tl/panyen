-- Grain (poste, idbank, periode) unique dans le rebasage.
select
    poste,
    idbank,
    periode
from {{ ref("int_ipc_rebase") }}
group by poste, idbank, periode
having count(*) > 1
