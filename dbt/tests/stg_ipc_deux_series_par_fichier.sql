-- Chaque fichier brut doit porter exactement les deux idbanks alimentaires.
select fichier_source
from {{ ref("stg_ipc") }}
group by fichier_source
having count(distinct idbank) <> 2
