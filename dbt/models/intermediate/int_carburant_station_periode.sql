-- Grain : (debut_effet, id_station, carburant_national).
-- Moyenne pondérée par la durée d'affichage sur chaque période d'effet du
-- plafond martiniquais (fuseau America/Martinique, UTC−4 sans DST).
-- Gazole seul ; une station au plus une fois par période.

with correspondance_directe as (
    select carburant_national
    from {{ ref("stg_correspondance_carburants") }}
    where statut_comparabilite = 'directe'
      and carburant_mq = 'gazole'
),

gazole as (
    select
        f.id_station,
        f.carburant_national,
        f.releve_utc,
        f.prix_eur_litre,
        f.code_postal,
        f.fichier_source,
        f.sha256_source,
        f.collecte_utc
    from {{ ref("fct_carburant_station") }} as f
    where f.carburant_national in (select carburant_national from correspondance_directe)
),

dernier_releve as (
    select max(releve_utc) as releve_utc_max
    from gazole
),

periodes as (
    select
        p.carburant_mq,
        p.debut_effet,
        p.fin_effet_exclusive,
        (p.debut_effet::timestamp + interval '4 hours') as debut_utc,
        case
            when p.fin_effet_exclusive is null then
                coalesce(
                    (select releve_utc_max from dernier_releve),
                    p.debut_effet::timestamp + interval '4 hours'
                )
            else (p.fin_effet_exclusive::timestamp + interval '4 hours')
        end as fin_utc,
        p.fin_effet_exclusive is null as periode_ouverte
    from {{ ref("fct_prix_max_mq") }} as p
    where p.carburant_mq = 'gazole'
),

stations_actives as (
    select distinct
        per.debut_effet,
        g.id_station
    from periodes as per
    inner join gazole as g
        on g.releve_utc >= per.debut_utc
        and g.releve_utc < per.fin_utc
),

releves_contexte as (
    select
        per.debut_effet,
        per.debut_utc,
        per.fin_utc,
        g.id_station,
        g.carburant_national,
        g.releve_utc,
        g.prix_eur_litre,
        g.code_postal,
        g.fichier_source,
        g.sha256_source,
        g.collecte_utc
    from periodes as per
    inner join gazole as g
        on (
            (g.releve_utc >= per.debut_utc and g.releve_utc < per.fin_utc)
            or (
                g.releve_utc < per.debut_utc
                and g.releve_utc >= per.debut_utc - interval '30 days'
            )
        )
    inner join stations_actives as sa
        on sa.debut_effet = per.debut_effet
        and sa.id_station = g.id_station
),

releves_ordonnes as (
    select
        rc.*,
        lead(rc.releve_utc) over (
            partition by rc.debut_effet, rc.id_station
            order by rc.releve_utc
        ) as releve_suivant
    from releves_contexte as rc
),

segments as (
    select
        ro.debut_effet,
        ro.id_station,
        ro.carburant_national,
        ro.code_postal,
        ro.fichier_source,
        ro.sha256_source,
        ro.collecte_utc,
        ro.prix_eur_litre,
        greatest(ro.releve_utc, ro.debut_utc) as segment_debut,
        least(coalesce(ro.releve_suivant, ro.fin_utc), ro.fin_utc) as segment_fin
    from releves_ordonnes as ro
    where greatest(ro.releve_utc, ro.debut_utc)
        < least(coalesce(ro.releve_suivant, ro.fin_utc), ro.fin_utc)
),

moyennes as (
    select
        debut_effet,
        id_station,
        carburant_national,
        min(code_postal) as code_postal,
        min(fichier_source) as fichier_source,
        min(sha256_source) as sha256_source,
        max(collecte_utc) as collecte_utc,
        sum(
            prix_eur_litre * date_diff(
                'millisecond',
                segment_debut,
                segment_fin
            )
        ) / sum(
            date_diff('millisecond', segment_debut, segment_fin)
        ) as prix_moyen_pondere_eur_litre
    from segments
    group by debut_effet, id_station, carburant_national
)

select
    debut_effet,
    id_station,
    carburant_national,
    prix_moyen_pondere_eur_litre as prix_eur_litre,
    code_postal,
    fichier_source,
    sha256_source,
    collecte_utc
from moyennes
