"""Tests du parseur carburants nationaux (ZIP/XML synthétiques)."""

from __future__ import annotations

import io
import json
import zipfile
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path

import pytest

from transformation import carburants as parseur


def _zip_bytes(membre: str, xml: str) -> bytes:
    tampon = io.BytesIO()
    with zipfile.ZipFile(tampon, "w") as archive:
        archive.writestr(membre, xml.encode("iso-8859-1"))
    return tampon.getvalue()


def _ecrire_zip(dossier: Path, identifiant: str, xml: str) -> Path:
    dossier.mkdir(parents=True, exist_ok=True)
    nom = f"{identifiant}_2026-09-10T120000Z.zip"
    chemin = dossier / nom
    contenu = _zip_bytes("PrixCarburants_test.xml", xml)
    chemin.write_bytes(contenu)
    meta = {
        "identifiant": identifiant,
        "url": f"https://donnees.roulez-eco.fr/opendata/{identifiant}",
        "collecte_utc": "2026-09-10T12:00:00Z",
        "taille_octets": len(contenu),
        "sha256": "abc",
        "categorie": "archive_annuelle",
        "periode": "2022",
        "nom_brut": nom,
    }
    Path(str(chemin) + ".json").write_text(
        json.dumps(meta), encoding="utf-8"
    )
    return chemin


XML_OK = """<?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?>
<pdv_liste>
  <pdv id="1000001" latitude="4620100" longitude="519800" cp="01000" pop="R">
    <ville>BOURG</ville>
    <prix nom="Gazole" id="1" maj="2022-04-02T10:00:00" valeur="1.850"/>
    <prix nom="SP95" id="2" maj="2022-03-01T10:00:00" valeur="1.700"/>
  </pdv>
  <pdv id="9720001" latitude="1460000" longitude="-6100000" cp="97200" pop="R">
    <ville>FDF</ville>
    <prix nom="Gazole" id="1" maj="2022-05-01T10:00:00" valeur="1.900"/>
  </pdv>
</pdv_liste>
"""


def test_parse_conversions_et_fenetre(tmp_path: Path):
    chemin = _ecrire_zip(tmp_path, "annee_2022", XML_OK)
    obs = parseur.parser_zip(chemin, racine=tmp_path)
    assert len(obs) == 1
    ligne = obs[0]
    assert ligne.id_station == "1000001"
    assert ligne.carburant_national == "Gazole"
    assert ligne.prix_eur_litre == Decimal("1.850")
    assert ligne.latitude == Decimal("46.20100")
    assert ligne.longitude == Decimal("5.19800")
    assert ligne.releve_utc == datetime(2022, 4, 2, 10, 0, 0, tzinfo=timezone.utc)
    assert ligne.code_postal == "01000"


def test_refuse_xml_malforme(tmp_path: Path):
    chemin = _ecrire_zip(tmp_path, "annee_2022", "<pdv_liste><pdv>")
    with pytest.raises(parseur.CarburantErreur, match="malformé|mal form"):
        parseur.parser_zip(chemin, racine=tmp_path)


def test_refuse_prix_invalide(tmp_path: Path):
    xml = XML_OK.replace('valeur="1.850"', 'valeur="-1"')
    chemin = _ecrire_zip(tmp_path, "annee_2022", xml)
    with pytest.raises(parseur.CarburantErreur, match="non positif"):
        parseur.parser_zip(chemin, racine=tmp_path)


def test_refuse_carburant_inconnu(tmp_path: Path):
    xml = XML_OK.replace('nom="Gazole"', 'nom="Kerosene"')
    chemin = _ecrire_zip(tmp_path, "annee_2022", xml)
    with pytest.raises(parseur.CarburantErreur, match="inconnu"):
        parseur.parser_zip(chemin, racine=tmp_path)


def test_exclut_flux_jour(tmp_path: Path):
    _ecrire_zip(tmp_path, "jour", XML_OK)
    assert parseur.lister_zips_historiques(tmp_path) == []


def test_ignore_pdv_sans_coordonnees(tmp_path: Path):
    xml = """<?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?>
<pdv_liste>
  <pdv id="1200004" latitude="" longitude="" cp="01200" pop="R">
    <ville>VALSERHONE</ville>
    <prix/>
  </pdv>
  <pdv id="1000001" latitude="4620100" longitude="519800" cp="01000" pop="R">
    <ville>BOURG</ville>
    <prix nom="Gazole" id="1" maj="2022-04-02T10:00:00" valeur="1.850"/>
  </pdv>
</pdv_liste>
"""
    chemin = _ecrire_zip(tmp_path, "annee_2022", xml)
    obs = parseur.parser_zip(chemin, racine=tmp_path)
    assert len(obs) == 1
    assert obs[0].id_station == "1000001"


def test_ignore_prix_vide_sans_attributs(tmp_path: Path):
    xml = XML_OK.replace(
        "</ville>",
        "</ville>\n    <prix/>",
        1,
    )
    chemin = _ecrire_zip(tmp_path, "annee_2022", xml)
    obs = parseur.parser_zip(chemin, racine=tmp_path)
    assert len(obs) == 1
    assert obs[0].carburant_national == "Gazole"


def test_refuse_prix_partiellement_renseigne(tmp_path: Path):
    xml = XML_OK.replace(
        '<prix nom="Gazole"',
        '<prix nom="" id="1" maj="2022-04-02T10:00:00" valeur="1.850"/>\n    <prix nom="Gazole"',
        1,
    )
    chemin = _ecrire_zip(tmp_path, "annee_2022", xml)
    with pytest.raises(parseur.CarburantErreur, match="incomplet"):
        parseur.parser_zip(chemin, racine=tmp_path)


def test_dedup_prix_dupliques_meme_horodatage(tmp_path: Path):
    xml = """<?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?>
<pdv_liste>
  <pdv id="76400009" latitude="4974544" longitude="37202" cp="76400" pop="R">
    <ville>FECAMP-SAINT LEONARD</ville>
    <prix nom="SP98" id="6" maj="2023-12-15T08:30:00" valeur="1.780"/>
    <prix nom="SP98" id="6" maj="2023-12-15T08:30:00" valeur="1.782"/>
  </pdv>
</pdv_liste>
"""
    chemin = _ecrire_zip(tmp_path, "annee_2023", xml)
    obs = parseur.parser_zip(chemin, racine=tmp_path)
    assert len(obs) == 1
    assert obs[0].prix_eur_litre == Decimal("1.782")


def test_conserve_provenance(tmp_path: Path):
    chemin = _ecrire_zip(tmp_path, "stock_2026", XML_OK)
    obs = parseur.parser_zip(chemin, racine=tmp_path)
    assert obs[0].sha256_source == "abc"
    assert obs[0].collecte_utc == datetime(2026, 9, 10, 12, 0, 0, tzinfo=timezone.utc)
    assert obs[0].membre_zip == "PrixCarburants_test.xml"


def _charger_reference():
    import importlib.util
    import sys

    chemin = Path("/private/tmp/panyen_3b/carburants_reference.py")
    nom = "carburants_reference"
    if nom in sys.modules:
        return sys.modules[nom]
    spec = importlib.util.spec_from_file_location(nom, chemin)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[nom] = module
    spec.loader.exec_module(module)
    return module


def _kwargs_membre(fichier: str = "f.xml") -> dict:
    return {
        "fichier_source": fichier,
        "sha256_source": "abc",
        "collecte_utc": datetime(2026, 9, 10, 12, 0, 0, tzinfo=timezone.utc),
        "membre_zip": "PrixCarburants_test.xml",
    }


@pytest.mark.parametrize(
    "xml",
    [
        XML_OK,
        """<?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?>
<pdv_liste>
  <pdv id="1200004" latitude="" longitude="" cp="01200" pop="R">
    <ville>VALSERHONE</ville>
    <prix/>
  </pdv>
  <pdv id="1000001" latitude="4620100" longitude="519800" cp="01000" pop="R">
    <ville>BOURG</ville>
    <prix nom="Gazole" id="1" maj="2022-04-02T10:00:00" valeur="1.850"/>
  </pdv>
</pdv_liste>
""",
        """<?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?>
<pdv_liste>
  <pdv id="76400009" latitude="4974544" longitude="37202" cp="76400" pop="R">
    <ville>FECAMP-SAINT LEONARD</ville>
    <prix nom="SP98" id="6" maj="2023-12-15T08:30:00" valeur="1.780"/>
    <prix nom="SP98" id="6" maj="2023-12-15T08:30:00" valeur="1.782"/>
  </pdv>
</pdv_liste>
""",
    ],
    ids=["xml_ok", "sans_coordonnees", "dedup_prix"],
)
def test_iterer_membre_xml_egal_parser_et_reference(xml: str):
    from dataclasses import astuple

    kwargs = _kwargs_membre()
    contenu = xml.encode("iso-8859-1")
    reference = _charger_reference()
    attendu = [astuple(o) for o in reference.parser_membre_xml(contenu, **kwargs)]
    via_parser = [astuple(o) for o in parseur.parser_membre_xml(contenu, **kwargs)]
    via_iter = [
        astuple(o) for o in parseur.iterer_membre_xml(io.BytesIO(contenu), **kwargs)
    ]
    assert via_iter == via_parser == attendu


def test_iterer_membre_xml_refuse_flux_tronque():
    kwargs = _kwargs_membre()
    xml = """<?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?>
<pdv_liste>
  <pdv id="1000001" latitude="4620100" longitude="519800" cp="01000" pop="R">
    <ville>BOURG</ville>
    <prix nom="Gazole" id="1" maj="2022-04-02T10:00:00" valeur="1.850"/>
  </pdv>
  <pdv id="1000002" latitude="4620100" longitude="519800" cp="01000" pop="R">
    <ville>TRONQUE
"""
    with pytest.raises(parseur.CarburantErreur, match="malformé|mal form"):
        list(parseur.iterer_membre_xml(io.BytesIO(xml.encode("iso-8859-1")), **kwargs))


class _CompteurOctets(io.RawIOBase):
    """Flux binaire qui compte les octets réellement lus."""

    def __init__(self, data: bytes):
        self._buf = io.BytesIO(data)
        self.octets_lus = 0

    def readable(self) -> bool:
        return True

    def read(self, size: int = -1) -> bytes:
        chunk = self._buf.read(size)
        self.octets_lus += len(chunk)
        return chunk

    def readinto(self, b) -> int:
        n = self._buf.readinto(b)
        if n:
            self.octets_lus += n
        return n


def test_iterer_membre_xml_emet_avant_moitie_du_flux():
    kwargs = _kwargs_membre()
    premier = """  <pdv id="1000001" latitude="4620100" longitude="519800" cp="01000" pop="R">
    <ville>BOURG</ville>
    <prix nom="Gazole" id="1" maj="2022-04-02T10:00:00" valeur="1.850"/>
  </pdv>
"""
    rembourrage = ("  <!-- " + ("x" * 80) + " -->\n") * 14_000
    xml = (
        '<?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?>\n'
        "<pdv_liste>\n"
        + premier
        + rembourrage
        + "</pdv_liste>\n"
    )
    contenu = xml.encode("iso-8859-1")
    assert len(contenu) >= 1_000_000
    flux = _CompteurOctets(contenu)
    generateur = parseur.iterer_membre_xml(flux, **kwargs)
    premiere = next(generateur)
    assert premiere.id_station == "1000001"
    assert flux.octets_lus < len(contenu) / 2
    list(generateur)


def test_iterer_zip_refuse_membre_dangereux_avant_emission(tmp_path: Path):
    chemin = tmp_path / "annee_2022_2026-09-10T120000Z.zip"
    with zipfile.ZipFile(chemin, "w") as archive:
        archive.writestr("PrixCarburants_test.xml", XML_OK.encode("iso-8859-1"))
        archive.writestr("../evil.xml", b"<pdv_liste/>")
    meta = {
        "identifiant": "annee_2022",
        "url": "https://donnees.roulez-eco.fr/opendata/annee_2022",
        "collecte_utc": "2026-09-10T12:00:00Z",
        "taille_octets": chemin.stat().st_size,
        "sha256": "abc",
        "categorie": "archive_annuelle",
        "periode": "2022",
        "nom_brut": chemin.name,
    }
    Path(str(chemin) + ".json").write_text(json.dumps(meta), encoding="utf-8")
    with pytest.raises(parseur.CarburantErreur, match="dangereux"):
        next(parseur.iterer_zip(chemin, racine=tmp_path))


def test_ecrire_lot_ndjson_aller_retour_duckdb(tmp_path: Path):
    import duckdb
    from dataclasses import astuple, fields

    from dbt.models.staging.stg_carburants import DDL

    obs = [
        parseur.ObservationCarburant(
            fichier_source="data/raw/x.zip",
            sha256_source="abc",
            collecte_utc=datetime(2026, 9, 10, 12, 0, 0, tzinfo=timezone.utc),
            membre_zip="a.xml",
            id_station="1000001",
            code_postal="01000",
            commune='BOURG\t"NORD"\nSUD\\est café',
            latitude=Decimal("-46.2010000"),
            longitude=Decimal("5.1980000"),
            carburant_national="Gazole",
            id_carburant="1",
            releve_utc=datetime(2022, 4, 2, 10, 0, 0, tzinfo=timezone.utc),
            prix_eur_litre=Decimal("1.8500"),
        ),
        parseur.ObservationCarburant(
            fichier_source="data/raw/x.zip",
            sha256_source="abc",
            collecte_utc=datetime(2026, 9, 10, 12, 0, 0, tzinfo=timezone.utc),
            membre_zip="a.xml",
            id_station="1000002",
            code_postal="75001",
            commune="",
            latitude=Decimal("48.8566000"),
            longitude=Decimal("2.3522000"),
            carburant_national="SP95",
            id_carburant="2",
            releve_utc=datetime(2022, 5, 1, 8, 30, 0, tzinfo=timezone.utc),
            prix_eur_litre=Decimal("1.9999"),
        ),
    ]
    chemin = tmp_path / "lot.ndjson"
    parseur.ecrire_lot_ndjson(obs, chemin)

    colonnes = [f.name for f in fields(parseur.ObservationCarburant)]
    cols_sql = ", ".join(colonnes)
    columns_map = "{" + ", ".join(f"{c}: 'VARCHAR'" for c in colonnes) + "}"
    select_caste = (
        "SELECT "
        "CAST(fichier_source AS VARCHAR) AS fichier_source, "
        "CAST(sha256_source AS VARCHAR) AS sha256_source, "
        "CAST(collecte_utc AS TIMESTAMPTZ) AS collecte_utc, "
        "CAST(membre_zip AS VARCHAR) AS membre_zip, "
        "CAST(id_station AS VARCHAR) AS id_station, "
        "CAST(code_postal AS VARCHAR) AS code_postal, "
        "CAST(commune AS VARCHAR) AS commune, "
        "CAST(latitude AS DECIMAL(12, 7)) AS latitude, "
        "CAST(longitude AS DECIMAL(12, 7)) AS longitude, "
        "CAST(carburant_national AS VARCHAR) AS carburant_national, "
        "CAST(id_carburant AS VARCHAR) AS id_carburant, "
        "CAST(releve_utc AS TIMESTAMPTZ) AS releve_utc, "
        "CAST(prix_eur_litre AS DECIMAL(12, 4)) AS prix_eur_litre "
        f"FROM read_json(?, format='newline_delimited', columns={columns_map})"
    )

    conn = duckdb.connect(":memory:")
    conn.execute(DDL)
    conn.executemany(
        f"INSERT INTO _stg_carburants VALUES ({', '.join(['?'] * 13)})",
        [astuple(o) for o in obs],
    )
    ref_except = conn.execute(
        f"SELECT {cols_sql} FROM _stg_carburants EXCEPT {select_caste}",
        [str(chemin)],
    ).fetchall()
    ndjson_except = conn.execute(
        f"{select_caste} EXCEPT SELECT {cols_sql} FROM _stg_carburants",
        [str(chemin)],
    ).fetchall()
    assert ref_except == []
    assert ndjson_except == []


def test_ecrire_lot_ndjson_refuse_datetime_naive(tmp_path: Path):
    obs = [
        parseur.ObservationCarburant(
            fichier_source="x.zip",
            sha256_source="abc",
            collecte_utc=datetime(2026, 9, 10, 12, 0, 0),  # sans fuseau
            membre_zip="a.xml",
            id_station="1",
            code_postal="01000",
            commune="",
            latitude=Decimal("1.0"),
            longitude=Decimal("2.0"),
            carburant_national="Gazole",
            id_carburant="1",
            releve_utc=datetime(2022, 4, 2, 10, 0, 0, tzinfo=timezone.utc),
            prix_eur_litre=Decimal("1.85"),
        )
    ]
    with pytest.raises((ValueError, parseur.CarburantErreur), match="fuseau|tzinfo"):
        parseur.ecrire_lot_ndjson(obs, tmp_path / "lot.ndjson")


def test_ecrire_lot_ndjson_refuse_type_inattendu(tmp_path: Path):
    obs = [
        parseur.ObservationCarburant(
            fichier_source="x.zip",
            sha256_source="abc",
            collecte_utc=datetime(2026, 9, 10, 12, 0, 0, tzinfo=timezone.utc),
            membre_zip="a.xml",
            id_station="1",
            code_postal="01000",
            commune="",
            latitude=Decimal("1.0"),
            longitude=Decimal("2.0"),
            carburant_national="Gazole",
            id_carburant="1",
            releve_utc=datetime(2022, 4, 2, 10, 0, 0, tzinfo=timezone.utc),
            prix_eur_litre=Decimal("1.85"),
        )
    ]
    object.__setattr__(obs[0], "id_station", 42)
    with pytest.raises((TypeError, ValueError, parseur.CarburantErreur)):
        parseur.ecrire_lot_ndjson(obs, tmp_path / "lot.ndjson")
