-- Grain : (annee_enquete, poste).
-- Toute valeur absente, en double ou différente de la page relue fait échouer.
with attendu as (
    select * from (
        values
        (2010, 'ensemble', 9.7, 0.1),
        (2015, 'ensemble', 12.3, 0.1),
        (2022, 'ensemble', 13.8, 0.1),
        (2010, 'alimentation', 29.5, 0.1),
        (2015, 'alimentation', 38.2, 0.1),
        (2022, 'alimentation', 40.2, 0.1),
        (2022, 'communications', 37.0, 1.0),
        (2022, 'meubles_entretien', 25.0, 1.0),
        (2022, 'alcool_tabac', 23.0, 1.0),
        (2022, 'sante', 13.0, 1.0),
        (2022, 'logement', 7.0, 1.0),
        (2022, 'transports', -5.0, 1.0)
    ) as t(annee_enquete, poste, ecart_fisher_pct, precision_pct)
),

effectif as (
    select
        annee_enquete,
        poste,
        ecart_fisher_pct,
        precision_pct
    from {{ ref("ecsp_niveaux") }}
),

doublons as (
    select annee_enquete, poste
    from effectif
    group by 1, 2
    having count(*) > 1
)

select
    'doublon' as motif,
    doublons.annee_enquete,
    doublons.poste
from doublons

union all

select
    'manquant_ou_different' as motif,
    attendu.annee_enquete,
    attendu.poste
from attendu
left join effectif
    on effectif.annee_enquete = attendu.annee_enquete
    and effectif.poste = attendu.poste
where
    effectif.poste is null
    or abs(effectif.ecart_fisher_pct - attendu.ecart_fisher_pct) > 1e-9
    or abs(effectif.precision_pct - attendu.precision_pct) > 1e-9

union all

select
    'ligne_imprevue' as motif,
    effectif.annee_enquete,
    effectif.poste
from effectif
left join attendu
    on attendu.annee_enquete = effectif.annee_enquete
    and attendu.poste = effectif.poste
where attendu.poste is null
