{{ config(severity='warn') }}

-- Écart |médiane distribution − moyenne Insee| > 0,05 €/L sur les périodes
-- mensuelles pleines (effet du 1er au 1er du mois suivant).

with insee_recent as (
    select *
    from {{ ref("stg_insee_carburants") }}
    where collecte_utc = (select max(collecte_utc) from {{ ref("stg_insee_carburants") }})
),

periodes_pleines as (
    select
        p.debut_effet,
        d.mediane_eur_litre,
        i.prix_moyen_eur_litre as insee_eur_litre,
        d.mediane_eur_litre - i.prix_moyen_eur_litre as ecart_eur_litre
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

select *
from periodes_pleines
where abs(ecart_eur_litre) > 0.05
