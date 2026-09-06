-- Grain : une ligne par (poste, idbank, periode) pour le dernier lot
-- quatre_postes_france_metropolitaine, de l'ancre 2022-04-01 au dernier mois
-- commun inclus. Chaque ratio d'indice est calculé dans un seul territoire et
-- un seul poste. Les niveaux bruts restent ici pour la traçabilité et ne sont
-- jamais appariés entre territoires.

with lot_quatre_postes as (
    select
        stg_ipc.fichier_source,
        stg_ipc.collecte_utc,
        stg_ipc.idbank,
        stg_ipc.poste,
        stg_ipc.code_territoire,
        stg_ipc.lot_collecte,
        stg_ipc.perimetre_reference,
        stg_ipc.periode,
        stg_ipc.valeur_indice,
        stg_ipc.statut_observation
    from {{ ref("stg_ipc") }} as stg_ipc
    where stg_ipc.lot_collecte = 'quatre_postes_france_metropolitaine'
),

fichier_actif as (
    select lot_quatre_postes.fichier_source
    from lot_quatre_postes
    order by lot_quatre_postes.collecte_utc desc, lot_quatre_postes.fichier_source desc
    limit 1
),

lot_actif as (
    select lot_quatre_postes.*
    from lot_quatre_postes
    inner join fichier_actif
        on lot_quatre_postes.fichier_source = fichier_actif.fichier_source
),

identite_lot as (
    select
        lot_actif.fichier_source,
        min(lot_actif.collecte_utc) as collecte_utc,
        min(lot_actif.lot_collecte) as lot_collecte,
        min(lot_actif.perimetre_reference) as perimetre_reference
    from lot_actif
    group by lot_actif.fichier_source
),

series_attendues as (
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

derniers_par_serie as (
    select
        lot_actif.poste,
        lot_actif.idbank,
        max(lot_actif.periode) as dernier_mois_serie
    from lot_actif
    inner join series_attendues
        on lot_actif.poste = series_attendues.poste
        and lot_actif.idbank = series_attendues.idbank
        and lot_actif.code_territoire = series_attendues.code_territoire
    where lot_actif.valeur_indice is not null
    group by lot_actif.poste, lot_actif.idbank
),

bornes as (
    select min(derniers_par_serie.dernier_mois_serie) as dernier_mois_commun
    from derniers_par_serie
    where (select count(*) from derniers_par_serie) = 8
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
        identite_lot.lot_collecte,
        identite_lot.perimetre_reference,
        series_attendues.poste,
        series_attendues.idbank,
        series_attendues.code_territoire,
        calendrier.periode,
        calendrier.dernier_mois_commun
    from calendrier
    cross join series_attendues
    cross join identite_lot
),

observations as (
    select
        grille.fichier_source,
        grille.collecte_utc,
        grille.poste,
        grille.idbank,
        grille.code_territoire,
        grille.lot_collecte,
        grille.perimetre_reference,
        grille.periode,
        grille.dernier_mois_commun,
        lot_actif.valeur_indice,
        lot_actif.statut_observation
    from grille
    left join lot_actif
        on lot_actif.periode = grille.periode
        and lot_actif.poste = grille.poste
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
            partition by
                observations.poste,
                observations.idbank,
                observations.code_territoire
        ) as indice_ancre
    from observations
)

select
    ancre.fichier_source,
    ancre.collecte_utc,
    ancre.poste,
    ancre.idbank,
    ancre.code_territoire,
    ancre.lot_collecte,
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
order by ancre.poste, ancre.periode, ancre.idbank
