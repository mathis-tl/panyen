-- Grain unique (poste, periode).
select
    poste,
    periode
from {{ ref("fct_differentiel_ipc") }}
group by poste, periode
having count(*) > 1
