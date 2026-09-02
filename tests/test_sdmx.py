"""Tests du parseur SDMX alimentaire : fixtures locales, aucun réseau."""

from datetime import date, datetime, timezone
from pathlib import Path

import pytest

from transformation.sdmx import ErreurSdmx, parser_fichier, parser_repertoire

NOM_BRUT = "ipc_alimentation_2026-09-02T150102Z.xml"
NOM_BRUT_2 = "ipc_alimentation_2026-09-03T080000Z.xml"


def _obs(
    periode: str = "2022-04",
    valeur: str | None = "102.4",
    statut: str = "A",
    qualite: str = "D",
    type_obs: str = "A",
    *,
    omettre: frozenset[str] = frozenset(),
) -> str:
    attributs = {
        "TIME_PERIOD": periode,
        "OBS_VALUE": valeur,
        "OBS_STATUS": statut,
        "OBS_QUAL": qualite,
        "OBS_TYPE": type_obs,
    }
    rendus = [
        f'{nom}="{val}"'
        for nom, val in attributs.items()
        if nom not in omettre and val is not None
    ]
    return "<Obs " + " ".join(rendus) + "/>"


def _serie(
    idbank: str = "011813726",
    freq: str = "M",
    ref_area: str = "D972",
    titre: str = "IPC alimentation Martinique",
    maj: str = "27/08/2026",
    unite: str = "indice",
    multiplicateur: str = "0",
    decimales: str = "2",
    observations: list[str] | None = None,
    *,
    omettre: frozenset[str] = frozenset(),
) -> str:
    attributs = {
        "IDBANK": idbank,
        "FREQ": freq,
        "REF_AREA": ref_area,
        "TITLE_FR": titre,
        "TITLE_EN": titre,
        "LAST_UPDATE": maj,
        "UNIT_MEASURE": unite,
        "UNIT_MULT": multiplicateur,
        "DECIMALS": decimales,
    }
    rendus = [
        f'{nom}="{val}"' for nom, val in attributs.items() if nom not in omettre
    ]
    corps = "".join(observations or [_obs(), _obs("2022-05", "103.1")])
    return f"<Series {' '.join(rendus)}>{corps}</Series>"


def xml_alimentaire(
    series: list[str] | None = None,
    *,
    dataset: bool = True,
) -> str:
    if series is None:
        series = [
            _serie(),
            _serie(
                idbank="011813717",
                ref_area="FE",
                titre="IPC alimentation France",
                observations=[
                    _obs(valeur="101.8"),
                    _obs("2022-05", "102.0"),
                ],
            ),
        ]
    dataset_xml = (
        f"<message:DataSet ss:structureRef=\"FR1_SERIES_BDM_1_0\">{''.join(series)}</message:DataSet>"
        if dataset
        else ""
    )
    return f"""\
<?xml version="1.0" encoding="UTF-8"?>
<message:StructureSpecificData xmlns:message="http://www.sdmx.org/resources/sdmxml/schemas/v2_1/message" xmlns:ss="http://www.sdmx.org/resources/sdmxml/schemas/v2_1/data/structurespecific">
  <message:Header>
    <message:ID>fixture</message:ID>
    <message:Test>false</message:Test>
    <message:Prepared>2026-09-02T15:01:02</message:Prepared>
    <message:Sender id="FR1"/>
  </message:Header>
  {dataset_xml}
</message:StructureSpecificData>
"""


def ecrire_brut(racine: Path, nom: str, xml: str) -> Path:
    cible = racine / "data" / "raw" / "insee" / nom
    cible.parent.mkdir(parents=True, exist_ok=True)
    cible.write_text(xml, encoding="utf-8")
    return cible


def _serie_fm(
    observations: list[str] | None = None,
    *,
    ref_area: str = "FM",
) -> str:
    return _serie(
        idbank="011813720",
        ref_area=ref_area,
        titre="IPC alimentation France métropolitaine",
        observations=observations
        or [
            _obs(valeur="101.8"),
            _obs("2022-05", "102.0"),
        ],
    )


def xml_alimentaire_metropole() -> str:
    return xml_alimentaire([_serie(), _serie_fm()])


def test_deux_series_et_plusieurs_observations(tmp_path: Path) -> None:
    brut = ecrire_brut(tmp_path, NOM_BRUT, xml_alimentaire())

    observations = parser_fichier(brut, racine=tmp_path)

    assert len(observations) == 4
    idbanks = {obs.idbank for obs in observations}
    assert idbanks == {"011813726", "011813717"}
    assert all(obs.idbank.startswith("0") for obs in observations)
    periodes = {(obs.idbank, obs.periode.isoformat()) for obs in observations}
    assert periodes == {
        ("011813726", "2022-04-01"),
        ("011813726", "2022-05-01"),
        ("011813717", "2022-04-01"),
        ("011813717", "2022-05-01"),
    }


def test_types_et_zero_initial(tmp_path: Path) -> None:
    brut = ecrire_brut(tmp_path, NOM_BRUT, xml_alimentaire())
    obs = parser_fichier(brut, racine=tmp_path)[0]

    assert type(obs.idbank) is str
    assert obs.idbank == "011813726"
    assert type(obs.periode) is date
    assert obs.periode == date(2022, 4, 1)
    assert type(obs.valeur_indice) is float
    assert type(obs.collecte_utc) is datetime
    assert obs.collecte_utc == datetime(2026, 9, 2, 15, 1, 2, tzinfo=timezone.utc)
    assert type(obs.multiplicateur_unite) is int
    assert type(obs.decimales) is int
    assert obs.frequence == "M"
    assert obs.code_territoire == "D972"


def test_provenance_issue_de_deux_noms_de_fichiers(tmp_path: Path) -> None:
    ecrire_brut(tmp_path, NOM_BRUT, xml_alimentaire())
    ecrire_brut(tmp_path, NOM_BRUT_2, xml_alimentaire())

    observations = parser_repertoire(
        tmp_path / "data" / "raw" / "insee",
        racine=tmp_path,
    )

    provenances = {(obs.fichier_source, obs.collecte_utc) for obs in observations}
    assert provenances == {
        (
            f"data/raw/insee/{NOM_BRUT}",
            datetime(2026, 9, 2, 15, 1, 2, tzinfo=timezone.utc),
        ),
        (
            f"data/raw/insee/{NOM_BRUT_2}",
            datetime(2026, 9, 3, 8, 0, 0, tzinfo=timezone.utc),
        ),
    }
    assert all(not Path(obs.fichier_source).is_absolute() for obs in observations)
    assert len(observations) == 8


def test_statuts_conserves(tmp_path: Path) -> None:
    xml = xml_alimentaire(
        [
            _serie(
                observations=[
                    _obs(statut="A", qualite="P", type_obs="A"),
                    _obs("2022-05", "103.1", statut="A", qualite="D", type_obs="E"),
                ]
            ),
            _serie(
                idbank="011813717",
                ref_area="FE",
                titre="IPC alimentation France",
                observations=[
                    _obs(valeur="101.8", statut="A", qualite="D", type_obs="A"),
                    _obs("2022-05", "102.0", statut="A", qualite="D", type_obs="A"),
                ],
            ),
        ]
    )
    brut = ecrire_brut(tmp_path, NOM_BRUT, xml)
    observations = parser_fichier(brut, racine=tmp_path)
    mq = [obs for obs in observations if obs.idbank == "011813726"]

    assert mq[0].statut_observation == "A"
    assert mq[0].qualite_observation == "P"
    assert mq[0].type_observation == "A"
    assert mq[1].qualite_observation == "D"
    assert mq[1].type_observation == "E"


def test_valeur_nd_nulle(tmp_path: Path) -> None:
    xml = xml_alimentaire(
        [
            _serie(
                observations=[
                    _obs(valeur=None, statut="ND", omettre=frozenset({"OBS_VALUE"})),
                    _obs("2022-05", "103.1"),
                ]
            ),
            _serie(
                idbank="011813717",
                ref_area="FE",
                titre="IPC alimentation France",
                observations=[
                    _obs(valeur="101.8"),
                    _obs("2022-05", "102.0"),
                ],
            ),
        ]
    )
    brut = ecrire_brut(tmp_path, NOM_BRUT, xml)
    nd = next(
        obs
        for obs in parser_fichier(brut, racine=tmp_path)
        if obs.statut_observation == "ND"
    )

    assert nd.valeur_indice is None
    assert nd.periode == date(2022, 4, 1)


def test_xml_invalide(tmp_path: Path) -> None:
    brut = ecrire_brut(tmp_path, NOM_BRUT, "<pas-du-xml")
    with pytest.raises(ErreurSdmx, match="invalide"):
        parser_fichier(brut, racine=tmp_path)


def test_serie_inconnue(tmp_path: Path) -> None:
    xml = xml_alimentaire(
        [
            _serie(idbank="011813873", titre="IPC énergie Martinique"),
            _serie(
                idbank="011813717",
                ref_area="FE",
                titre="IPC alimentation France",
            ),
        ]
    )
    brut = ecrire_brut(tmp_path, NOM_BRUT, xml)
    with pytest.raises(ErreurSdmx, match="idbank"):
        parser_fichier(brut, racine=tmp_path)


def test_serie_manquante(tmp_path: Path) -> None:
    xml = xml_alimentaire([_serie()])
    brut = ecrire_brut(tmp_path, NOM_BRUT, xml)
    with pytest.raises(ErreurSdmx, match="paire incomplète"):
        parser_fichier(brut, racine=tmp_path)


def test_attribut_requis_absent(tmp_path: Path) -> None:
    xml = xml_alimentaire(
        [
            _serie(omettre=frozenset({"REF_AREA"})),
            _serie(
                idbank="011813717",
                ref_area="FE",
                titre="IPC alimentation France",
            ),
        ]
    )
    brut = ecrire_brut(tmp_path, NOM_BRUT, xml)
    with pytest.raises(ErreurSdmx, match="attribut"):
        parser_fichier(brut, racine=tmp_path)


def test_doublon_du_grain(tmp_path: Path) -> None:
    xml = xml_alimentaire(
        [
            _serie(
                observations=[
                    _obs("2022-04", "102.4"),
                    _obs("2022-04", "102.5"),
                ]
            ),
            _serie(
                idbank="011813717",
                ref_area="FE",
                titre="IPC alimentation France",
            ),
        ]
    )
    brut = ecrire_brut(tmp_path, NOM_BRUT, xml)
    with pytest.raises(ErreurSdmx, match="doublon"):
        parser_fichier(brut, racine=tmp_path)


def test_periode_invalide(tmp_path: Path) -> None:
    xml = xml_alimentaire(
        [
            _serie(observations=[_obs("2022-13", "102.4"), _obs("2022-05", "103.1")]),
            _serie(
                idbank="011813717",
                ref_area="FE",
                titre="IPC alimentation France",
            ),
        ]
    )
    brut = ecrire_brut(tmp_path, NOM_BRUT, xml)
    with pytest.raises(ErreurSdmx, match="période"):
        parser_fichier(brut, racine=tmp_path)


def test_valeur_invalide(tmp_path: Path) -> None:
    xml = xml_alimentaire(
        [
            _serie(
                observations=[
                    _obs(valeur="pas-un-nombre"),
                    _obs("2022-05", "103.1"),
                ]
            ),
            _serie(
                idbank="011813717",
                ref_area="FE",
                titre="IPC alimentation France",
            ),
        ]
    )
    brut = ecrire_brut(tmp_path, NOM_BRUT, xml)
    with pytest.raises(ErreurSdmx, match="valeur"):
        parser_fichier(brut, racine=tmp_path)


def test_valeur_absente_sans_nd(tmp_path: Path) -> None:
    xml = xml_alimentaire(
        [
            _serie(
                observations=[
                    _obs(valeur=None, statut="A", omettre=frozenset({"OBS_VALUE"})),
                    _obs("2022-05", "103.1"),
                ]
            ),
            _serie(
                idbank="011813717",
                ref_area="FE",
                titre="IPC alimentation France",
            ),
        ]
    )
    brut = ecrire_brut(tmp_path, NOM_BRUT, xml)
    with pytest.raises(ErreurSdmx, match="valeur"):
        parser_fichier(brut, racine=tmp_path)


def test_absence_de_fichier(tmp_path: Path) -> None:
    dossier = tmp_path / "data" / "raw" / "insee"
    dossier.mkdir(parents=True)
    with pytest.raises(ErreurSdmx, match="aucun fichier"):
        parser_repertoire(dossier, racine=tmp_path)


def test_nom_fichier_non_conforme(tmp_path: Path) -> None:
    ecrire_brut(tmp_path, "ipc_alimentation_invalide.xml", xml_alimentaire())
    with pytest.raises(ErreurSdmx, match="non conforme"):
        parser_repertoire(tmp_path / "data" / "raw" / "insee", racine=tmp_path)


def test_xml_vide(tmp_path: Path) -> None:
    brut = ecrire_brut(tmp_path, NOM_BRUT, xml_alimentaire(series=[], dataset=True))
    with pytest.raises(ErreurSdmx, match="vide"):
        parser_fichier(brut, racine=tmp_path)


def test_lot_historique_etiquette_france_entiere(tmp_path: Path) -> None:
    brut = ecrire_brut(tmp_path, NOM_BRUT, xml_alimentaire())
    observations = parser_fichier(brut, racine=tmp_path)
    idbanks = {obs.idbank for obs in observations}
    territoires = {(obs.idbank, obs.code_territoire) for obs in observations}

    assert idbanks == {"011813726", "011813717"}
    assert territoires == {("011813726", "D972"), ("011813717", "FE")}
    assert {obs.perimetre_reference for obs in observations} == {
        "france_entiere_historique"
    }


def test_lot_metropolitain_etiquette_france_metropolitaine(tmp_path: Path) -> None:
    brut = ecrire_brut(tmp_path, NOM_BRUT, xml_alimentaire_metropole())
    observations = parser_fichier(brut, racine=tmp_path)
    idbanks = {obs.idbank for obs in observations}
    territoires = {(obs.idbank, obs.code_territoire) for obs in observations}

    assert idbanks == {"011813726", "011813720"}
    assert territoires == {("011813726", "D972"), ("011813720", "FM")}
    assert {obs.perimetre_reference for obs in observations} == {
        "france_metropolitaine"
    }


def test_correspondances_idbank_territoire(tmp_path: Path) -> None:
    historique = parser_fichier(
        ecrire_brut(tmp_path, NOM_BRUT, xml_alimentaire()),
        racine=tmp_path,
    )
    metro = parser_fichier(
        ecrire_brut(tmp_path, NOM_BRUT_2, xml_alimentaire_metropole()),
        racine=tmp_path,
    )
    correspondances = {(obs.idbank, obs.code_territoire) for obs in historique + metro}

    assert correspondances == {
        ("011813726", "D972"),
        ("011813717", "FE"),
        ("011813720", "FM"),
    }


def test_territoire_incoherent(tmp_path: Path) -> None:
    xml = xml_alimentaire(
        [
            _serie(ref_area="FE"),
            _serie(
                idbank="011813717",
                ref_area="FE",
                titre="IPC alimentation France",
            ),
        ]
    )
    brut = ecrire_brut(tmp_path, NOM_BRUT, xml)
    with pytest.raises(ErreurSdmx, match="territoire"):
        parser_fichier(brut, racine=tmp_path)


def test_paire_incomplete(tmp_path: Path) -> None:
    xml = xml_alimentaire([_serie()])
    brut = ecrire_brut(tmp_path, NOM_BRUT, xml)
    with pytest.raises(ErreurSdmx, match="paire incomplète"):
        parser_fichier(brut, racine=tmp_path)


def test_paire_melangee(tmp_path: Path) -> None:
    xml = xml_alimentaire(
        [
            _serie(
                idbank="011813717",
                ref_area="FE",
                titre="IPC alimentation France",
            ),
            _serie_fm(),
        ]
    )
    brut = ecrire_brut(tmp_path, NOM_BRUT, xml)
    with pytest.raises(ErreurSdmx, match="paire mélangée"):
        parser_fichier(brut, racine=tmp_path)


def test_troisieme_idbank(tmp_path: Path) -> None:
    xml = xml_alimentaire(
        [
            _serie(),
            _serie(
                idbank="011813717",
                ref_area="FE",
                titre="IPC alimentation France",
            ),
            _serie_fm(),
        ]
    )
    brut = ecrire_brut(tmp_path, NOM_BRUT, xml)
    with pytest.raises(ErreurSdmx, match="troisième idbank"):
        parser_fichier(brut, racine=tmp_path)


def test_repertoire_historique_et_metropolitain(tmp_path: Path) -> None:
    ecrire_brut(tmp_path, NOM_BRUT, xml_alimentaire())
    ecrire_brut(tmp_path, NOM_BRUT_2, xml_alimentaire_metropole())

    observations = parser_repertoire(
        tmp_path / "data" / "raw" / "insee",
        racine=tmp_path,
    )

    par_fichier = {
        obs.fichier_source: obs.perimetre_reference for obs in observations
    }
    assert par_fichier[f"data/raw/insee/{NOM_BRUT}"] == "france_entiere_historique"
    assert par_fichier[f"data/raw/insee/{NOM_BRUT_2}"] == "france_metropolitaine"
    assert {obs.idbank for obs in observations} == {
        "011813726",
        "011813717",
        "011813720",
    }
