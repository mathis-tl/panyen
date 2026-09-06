-- Une observation valide pour chaque série attendue et chaque mois de l'ancre
-- au dernier mois commun. Aucun trou interne ni ND dans cette fenêtre.
with bornes as (
    select
        date '2022-04-01' as ancre,
        min(int_ipc_rebase.dernier_mois_commun) as dernier_mois_commun,
        max(int_ipc_rebase.dernier_mois_commun) as dernier_mois_commun_max
    from {{ ref("int_ipc_rebase") }} as int_ipc_rebase
),

series as (
    select
        attendu.poste,
        attendu.idbank,
        attendu.code_territoire
    from (
        values
            ('alimentation', '011813726', 'D972'),
            ('alimentation', '011813720', 'FM'),
            ('energie', '011813873', 'D972'),
            ('energie', '011813867', 'FM'),
            ('produits_manufactures', '011813789', 'D972'),
            ('produits_manufactures', '011813783', 'FM'),
            ('services', '011813915', 'D972'),
            ('services', '011813909', 'FM')
    ) as attendu(poste, idbank, code_territoire)
),

attendu as (
    select
        cast(
            date '2022-04-01' + (interval '1 month' * mois.n)
            as date
        ) as periode,
        series.poste,
        series.idbank,
        series.code_territoire
    from bornes
    cross join range(
        0,
        1 + date_diff('month', bornes.ancre, bornes.dernier_mois_commun)
    ) as mois(n)
    cross join series
    where bornes.dernier_mois_commun = bornes.dernier_mois_commun_max
),

observe as (
    select
        int_ipc_rebase.periode,
        int_ipc_rebase.poste,
        int_ipc_rebase.idbank,
        int_ipc_rebase.code_territoire,
        int_ipc_rebase.valeur_indice,
        int_ipc_rebase.statut_observation,
        int_ipc_rebase.facteur,
        int_ipc_rebase.evolution_pct
    from {{ ref("int_ipc_rebase") }} as int_ipc_rebase
)

select
    'manquant_ou_invalide' as motif,
    attendu.periode,
    attendu.poste,
    attendu.idbank,
    attendu.code_territoire
from attendu
left join observe
    on observe.periode = attendu.periode
    and observe.poste = attendu.poste
    and observe.idbank = attendu.idbank
    and observe.code_territoire = attendu.code_territoire
where observe.periode is null
   or observe.valeur_indice is null
   or observe.statut_observation = 'ND'
   or observe.facteur is null
   or observe.evolution_pct is null

union all

select
    'hors_calendrier' as motif,
    observe.periode,
    observe.poste,
    observe.idbank,
    observe.code_territoire
from observe
left join attendu
    on attendu.periode = observe.periode
    and attendu.poste = observe.poste
    and attendu.idbank = observe.idbank
    and attendu.code_territoire = observe.code_territoire
where attendu.periode is null
