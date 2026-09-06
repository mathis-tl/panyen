-- Le triplet (idbank, poste, code_territoire) ne prend que les neuf
-- combinaisons du référentiel.
select
    fichier_source,
    idbank,
    poste,
    code_territoire
from {{ ref("stg_ipc") }}
where not (
    (idbank = '011813726' and poste = 'alimentation' and code_territoire = 'D972')
    or (idbank = '011813717' and poste = 'alimentation' and code_territoire = 'FE')
    or (idbank = '011813720' and poste = 'alimentation' and code_territoire = 'FM')
    or (idbank = '011813873' and poste = 'energie' and code_territoire = 'D972')
    or (idbank = '011813867' and poste = 'energie' and code_territoire = 'FM')
    or (idbank = '011813789' and poste = 'produits_manufactures' and code_territoire = 'D972')
    or (idbank = '011813783' and poste = 'produits_manufactures' and code_territoire = 'FM')
    or (idbank = '011813915' and poste = 'services' and code_territoire = 'D972')
    or (idbank = '011813909' and poste = 'services' and code_territoire = 'FM')
)
