-- Grain : une ligne ensemble à l'ancre 2022-04-01.
-- L'ancre de l'ensemble doit valoir exactement la mesure ECSP de ecsp_niveaux
-- (2022, ensemble) et être étiquetée mesure_ecsp_2022 ; toute autre valeur échoue.
with attendu as (
    select ecart_fisher_pct
    from {{ ref("ecsp_niveaux") }}
    where annee_enquete = 2022 and poste = 'ensemble'
),

ancre as (
    select ecart_prix_estime_pct, nature_ecart, ecart_ecsp_2022_pct
    from {{ ref("fct_differentiel_ipc") }}
    where poste = 'ensemble' and periode = date '2022-04-01'
)

select 'ancre_absente' as motif
where not exists (select 1 from ancre)

union all

select 'ancre_differente' as motif
from ancre
cross join attendu
where
    abs(ancre.ecart_ecsp_2022_pct - attendu.ecart_fisher_pct) > 1e-9
    or abs(ancre.ecart_prix_estime_pct - attendu.ecart_fisher_pct) > 1e-9
    or ancre.nature_ecart is distinct from 'mesure_ecsp_2022'
