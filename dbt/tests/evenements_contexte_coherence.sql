-- Grain unique, postes connus, date au premier du mois quand la précision
-- est le mois, source en https.
select 'doublon' as motif, date_evenement, titre
from {{ ref("evenements_contexte") }}
group by date_evenement, titre
having count(*) > 1

union all

select 'poste_inconnu' as motif, date_evenement, titre
from {{ ref("evenements_contexte") }}
cross join unnest(string_split(postes_concernes, '|')) as p(poste)
where p.poste not in (
    'alimentation', 'energie', 'produits_manufactures', 'services', 'tous'
)

union all

select 'precision_mois' as motif, date_evenement, titre
from {{ ref("evenements_contexte") }}
where precision_date = 'mois' and extract(day from date_evenement) != 1

union all

select 'url' as motif, date_evenement, titre
from {{ ref("evenements_contexte") }}
where url_source not like 'https://%'
