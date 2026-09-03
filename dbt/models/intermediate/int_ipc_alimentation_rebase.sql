-- Grain : une ligne par (fichier_source, idbank, periode) pour le dernier
-- lot métropolitain actif, de l'ancre 2022-04-01 au dernier mois commun inclus.
-- Chaque ratio d'indice est calculé dans un seul territoire. Les niveaux bruts
-- restent ici pour la traçabilité et ne sont jamais appariés entre territoires.

with lot_metro as (
    select
        stg_ipc.fichier_source,
        stg_ipc.collecte_utc,
        stg_ipc.idbank,
        stg_ipc.code_territoire,
        stg_ipc.perimetre_reference,
        stg_ipc.periode,
        stg_ipc.valeur_indice,
        stg_ipc.statut_observation
    from {{ ref("stg_ipc") }} as stg_ipc
    where stg_ipc.perimetre_reference = 'france_metropolitaine'
),

fichier_actif as (
    select lot_metro.fichier_source
    from lot_metro
    order by lot_metro.collecte_utc desc, lot_metro.fichier_source desc
    limit 1
),

lot_actif as (
    select lot_metro.*
    from lot_metro
    inner join fichier_actif
        on lot_metro.fichier_source = fichier_actif.fichier_source
),

identite_lot as (
    select
        lot_actif.fichier_source,
        min(lot_actif.collecte_utc) as collecte_utc,
        min(lot_actif.perimetre_reference) as perimetre_reference
    from lot_actif
    group by lot_actif.fichier_source
),

derniers_par_territoire as (
    select
        lot_actif.idbank,
        max(lot_actif.periode) as dernier_mois_territoire
    from lot_actif
    where lot_actif.valeur_indice is not null
      and (
          (lot_actif.idbank = '011813726' and lot_actif.code_territoire = 'D972')
          or (lot_actif.idbank = '011813720' and lot_actif.code_territoire = 'FM')
      )
    group by lot_actif.idbank
),

bornes as (
    select min(derniers_par_territoire.dernier_mois_territoire) as dernier_mois_commun
    from derniers_par_territoire
    where (select count(*) from derniers_par_territoire) = 2
),

territoires_attendus as (
    select
        attendu.idbank,
        attendu.code_territoire
    from (
        values
            ('011813726', 'D972'),
            ('011813720', 'FM')
    ) as attendu(idbank, code_territoire)
),

calendrier as (
    select
        cast(
            date '2022-04-01' + (interval '1 month' * mois.n)
            as date
        ) as periode,
        bornes.dernier_mois_commun
    from bornes
    cross join range(
        0,
        1 + date_diff(
            'month',
            date '2022-04-01',
            bornes.dernier_mois_commun
        )
    ) as mois(n)
),

grille as (
    select
        identite_lot.fichier_source,
        identite_lot.collecte_utc,
        identite_lot.perimetre_reference,
        territoires_attendus.idbank,
        territoires_attendus.code_territoire,
        calendrier.periode,
        calendrier.dernier_mois_commun
    from calendrier
    cross join territoires_attendus
    cross join identite_lot
),

observations as (
    select
        grille.fichier_source,
        grille.collecte_utc,
        grille.idbank,
        grille.code_territoire,
        grille.perimetre_reference,
        grille.periode,
        grille.dernier_mois_commun,
        lot_actif.valeur_indice,
        lot_actif.statut_observation
    from grille
    left join lot_actif
        on lot_actif.periode = grille.periode
        and lot_actif.idbank = grille.idbank
        and lot_actif.code_territoire = grille.code_territoire
),

ancre as (
    select
        observations.*,
        max(
            case
                when observations.periode = date '2022-04-01'
                then observations.valeur_indice
            end
        ) over (
            partition by observations.idbank, observations.code_territoire
        ) as indice_ancre
    from observations
)

select
    ancre.fichier_source,
    ancre.collecte_utc,
    ancre.idbank,
    ancre.code_territoire,
    ancre.perimetre_reference,
    ancre.periode,
    ancre.dernier_mois_commun,
    ancre.valeur_indice,
    ancre.statut_observation,
    ancre.valeur_indice / nullif(ancre.indice_ancre, 0) as facteur,
    (
        ancre.valeur_indice / nullif(ancre.indice_ancre, 0) - 1
    ) * 100 as evolution_pct
from ancre
order by ancre.periode, ancre.idbank
