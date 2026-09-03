-- Une observation valide pour chaque territoire et chaque mois de l'ancre
-- au dernier mois commun. Aucun trou interne ni ND dans cette fenêtre.
with bornes as (
    select
        date '2022-04-01' as ancre,
        min(int_ipc_alimentation_rebase.dernier_mois_commun) as dernier_mois_commun,
        max(int_ipc_alimentation_rebase.dernier_mois_commun) as dernier_mois_commun_max
    from {{ ref("int_ipc_alimentation_rebase") }} as int_ipc_alimentation_rebase
),

territoires as (
    select
        attendu.idbank,
        attendu.code_territoire
    from (
        values
            ('011813726', 'D972'),
            ('011813720', 'FM')
    ) as attendu(idbank, code_territoire)
),

attendu as (
    select
        cast(
            date '2022-04-01' + (interval '1 month' * mois.n)
            as date
        ) as periode,
        territoires.idbank,
        territoires.code_territoire
    from bornes
    cross join range(
        0,
        1 + date_diff('month', bornes.ancre, bornes.dernier_mois_commun)
    ) as mois(n)
    cross join territoires
    where bornes.dernier_mois_commun = bornes.dernier_mois_commun_max
),

observe as (
    select
        int_ipc_alimentation_rebase.periode,
        int_ipc_alimentation_rebase.idbank,
        int_ipc_alimentation_rebase.code_territoire,
        int_ipc_alimentation_rebase.valeur_indice,
        int_ipc_alimentation_rebase.statut_observation,
        int_ipc_alimentation_rebase.facteur,
        int_ipc_alimentation_rebase.evolution_pct
    from {{ ref("int_ipc_alimentation_rebase") }} as int_ipc_alimentation_rebase
)

select
    'manquant_ou_invalide' as motif,
    attendu.periode,
    attendu.idbank,
    attendu.code_territoire
from attendu
left join observe
    on observe.periode = attendu.periode
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
    observe.idbank,
    observe.code_territoire
from observe
left join attendu
    on attendu.periode = observe.periode
    and attendu.idbank = observe.idbank
    and attendu.code_territoire = observe.code_territoire
where attendu.periode is null
