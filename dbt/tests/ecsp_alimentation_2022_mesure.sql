-- Une seule ligne, mesure Fisher +40 %, ancre et URL exactes.
-- La cardinalité est contrôlée par une ligne scalaire indépendante du seed :
-- 0 ou >1 ligne produit toujours une ligne d'échec, même si le seed est vide.
with cardinalite as (
    select count(*) as n
    from {{ ref("ecsp_alimentation_2022") }}
)

select 'cardinalite' as motif
from cardinalite
where cardinalite.n != 1

union all

select 'contenu' as motif
from {{ ref("ecsp_alimentation_2022") }} as ecsp_alimentation_2022
cross join cardinalite
where cardinalite.n = 1
  and (
      ecsp_alimentation_2022.poste != 'alimentation'
      or ecsp_alimentation_2022.territoire_compare != 'D972'
      or ecsp_alimentation_2022.territoire_reference != 'FM'
      or ecsp_alimentation_2022.periode_ancrage != date '2022-04-01'
      or abs(ecsp_alimentation_2022.ecart_fisher_pct - 40.0) > 1e-10
      or ecsp_alimentation_2022.methode != 'Fisher'
      or ecsp_alimentation_2022.periode_enquete != 'mars-avril 2022'
      or ecsp_alimentation_2022.source_ecsp
           != 'https://www.insee.fr/fr/statistiques/7649202'
  )
