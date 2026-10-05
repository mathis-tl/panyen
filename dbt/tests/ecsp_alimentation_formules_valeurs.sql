-- Grain : (annee_enquete, formule).
-- Valeurs relues le 2026-10-05 sur Insee Analyses Martinique n° 63.
with attendu as (
    select * from (
        values
        (2022, 'paasche_panier_martiniquais', 31.0),
        (2022, 'laspeyres_panier_hexagonal', 50.0)
    ) as t(annee_enquete, formule, ecart_pct)
),

effectif as (
    select annee_enquete, formule, ecart_pct
    from {{ ref("ecsp_alimentation_formules") }}
),

doublons as (
    select annee_enquete, formule
    from effectif
    group by 1, 2
    having count(*) > 1
)

select 'doublon' as motif, doublons.annee_enquete, doublons.formule
from doublons

union all

select 'manquant_ou_different' as motif, attendu.annee_enquete, attendu.formule
from attendu
left join effectif
    on effectif.annee_enquete = attendu.annee_enquete
    and effectif.formule = attendu.formule
where
    effectif.formule is null
    or abs(effectif.ecart_pct - attendu.ecart_pct) > 1e-9

union all

select 'ligne_imprevue' as motif, effectif.annee_enquete, effectif.formule
from effectif
left join attendu
    on attendu.annee_enquete = effectif.annee_enquete
    and attendu.formule = effectif.formule
where attendu.formule is null
