-- Grain : (annee, indicateur).
-- Valeurs relues le 2026-10-05 sur la page Insee des disparités territoriales.
with attendu as (
    select * from (
        values
        (2024, 'salaire_net_moyen_prive', -10.7),
        (2024, 'salaire_net_moyen_fonction_publique', 19.7),
        (2023, 'revenu_salarial', 2.1),
        (2024, 'revenu_activite_non_salaries', -13.6)
    ) as t(annee, indicateur, ecart_moyenne_nationale_pct)
),

effectif as (
    select annee, indicateur, ecart_moyenne_nationale_pct
    from {{ ref("revenus_ecart_national") }}
),

doublons as (
    select annee, indicateur
    from effectif
    group by 1, 2
    having count(*) > 1
)

select 'doublon' as motif, doublons.annee, doublons.indicateur
from doublons

union all

select 'manquant_ou_different' as motif, attendu.annee, attendu.indicateur
from attendu
left join effectif
    on effectif.annee = attendu.annee
    and effectif.indicateur = attendu.indicateur
where
    effectif.indicateur is null
    or abs(
        effectif.ecart_moyenne_nationale_pct
        - attendu.ecart_moyenne_nationale_pct
    ) > 1e-9

union all

select 'ligne_imprevue' as motif, effectif.annee, effectif.indicateur
from effectif
left join attendu
    on attendu.annee = effectif.annee
    and attendu.indicateur = effectif.indicateur
where attendu.indicateur is null
