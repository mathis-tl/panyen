-- Échoue s'il n'y a aucun mois plein comparé à l'Insee.
-- Même jointure que coherence_carburants_insee.sql, sans le seuil de 0,05 €.
-- Sévérité error : un warn passerait encore si la jointure est vide.

with insee_recent as (
    select *
    from {{ ref("stg_insee_carburants") }}
    where collecte_utc = (select max(collecte_utc) from {{ ref("stg_insee_carburants") }})
),

periodes_pleines as (
    select p.debut_effet
    from {{ ref("fct_distribution_carburants_metropole") }} as d
    inner join {{ ref("fct_prix_max_mq") }} as p
        on p.debut_effet = d.mois
        and p.carburant_mq = 'gazole'
    inner join insee_recent as i
        on i.periode = p.debut_effet
    where d.carburant_national = 'Gazole'
      and p.fin_effet_exclusive = (
          date_trunc('month', p.debut_effet) + interval '1 month'
      )::date
      and p.debut_effet = date_trunc('month', p.debut_effet)
)

select 'aucun mois plein comparé à l''Insee' as erreur
where (select count(*) from periodes_pleines) = 0
