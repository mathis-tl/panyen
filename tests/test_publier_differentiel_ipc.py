"""Publication Parquet sûre : vérification avant export, conservation sur échec."""

from __future__ import annotations

import hashlib
import os
from pathlib import Path
from unittest.mock import MagicMock

import duckdb
import pytest

from publication import publier_differentiel_ipc as pub

CONTENU_SAIN_SYNTHETIQUE = b"PARQUET-SAIN-SYNTHETIQUE-v1"


def sha256(chemin: Path) -> str:
    return hashlib.sha256(chemin.read_bytes()).hexdigest()


def creer_base_synthetique(
    chemin_db: Path,
    lignes: list[dict] | None = None,
    *,
    creer_table: bool = True,
) -> Path:
    """Petite base DuckDB synthétique, jamais la base réelle du dépôt."""
    chemin_db.parent.mkdir(parents=True, exist_ok=True)
    if lignes is None:
        lignes = [
            {
                "periode": "2022-04-01",
                "dernier_mois_commun": "2022-05-01",
                "poste": "alimentation",
                "libelle_poste": "Alimentation",
                "fichier_source": "data/raw/insee/ipc_synth.xml",
                "collecte_utc": "2026-09-01 00:00:00+00",
                "idbank_martinique": "011813726",
                "idbank_france_metropolitaine": "011813720",
                "facteur_martinique": 1.0,
                "facteur_france_metropolitaine": 1.0,
                "evolution_martinique_pct": 0.0,
                "evolution_france_metropolitaine_pct": 0.0,
                "differentiel_evolution_points": 0.0,
                "coefficient_ecart": 1.0,
                "ancre_ecsp_disponible": True,
                "ecart_ecsp_2022_pct": 40.0,
                "ecart_prix_estime_pct": 40.0,
                "source_ecsp": "https://www.insee.fr/fr/statistiques/7649202",
                "nature_ecart": "mesure_ecsp_2022",
            },
            {
                "periode": "2022-05-01",
                "dernier_mois_commun": "2022-05-01",
                "poste": "alimentation",
                "libelle_poste": "Alimentation",
                "fichier_source": "data/raw/insee/ipc_synth.xml",
                "collecte_utc": "2026-09-01 00:00:00+00",
                "idbank_martinique": "011813726",
                "idbank_france_metropolitaine": "011813720",
                "facteur_martinique": 1.25,
                "facteur_france_metropolitaine": 1.0,
                "evolution_martinique_pct": 25.0,
                "evolution_france_metropolitaine_pct": 0.0,
                "differentiel_evolution_points": 25.0,
                "coefficient_ecart": 1.25,
                "ancre_ecsp_disponible": True,
                "ecart_ecsp_2022_pct": 40.0,
                "ecart_prix_estime_pct": 75.0,
                "source_ecsp": "https://www.insee.fr/fr/statistiques/7649202",
                "nature_ecart": "estimation_a_partir_ecsp_2022",
            },
            {
                "periode": "2022-04-01",
                "dernier_mois_commun": "2022-05-01",
                "poste": "energie",
                "libelle_poste": "Énergie",
                "fichier_source": "data/raw/insee/ipc_synth.xml",
                "collecte_utc": "2026-09-01 00:00:00+00",
                "idbank_martinique": "011813873",
                "idbank_france_metropolitaine": "011813867",
                "facteur_martinique": 1.0,
                "facteur_france_metropolitaine": 1.0,
                "evolution_martinique_pct": 0.0,
                "evolution_france_metropolitaine_pct": 0.0,
                "differentiel_evolution_points": 0.0,
                "coefficient_ecart": 1.0,
                "ancre_ecsp_disponible": False,
                "ecart_ecsp_2022_pct": None,
                "ecart_prix_estime_pct": None,
                "source_ecsp": None,
                "nature_ecart": None,
            },
            {
                "periode": "2022-05-01",
                "dernier_mois_commun": "2022-05-01",
                "poste": "energie",
                "libelle_poste": "Énergie",
                "fichier_source": "data/raw/insee/ipc_synth.xml",
                "collecte_utc": "2026-09-01 00:00:00+00",
                "idbank_martinique": "011813873",
                "idbank_france_metropolitaine": "011813867",
                "facteur_martinique": 1.1,
                "facteur_france_metropolitaine": 1.05,
                "evolution_martinique_pct": 10.0,
                "evolution_france_metropolitaine_pct": 5.0,
                "differentiel_evolution_points": 5.0,
                "coefficient_ecart": 1.1 / 1.05,
                "ancre_ecsp_disponible": False,
                "ecart_ecsp_2022_pct": None,
                "ecart_prix_estime_pct": None,
                "source_ecsp": None,
                "nature_ecart": None,
            },
        ]

    con = duckdb.connect(str(chemin_db))
    if creer_table:
        con.execute(
            """
            create table fct_differentiel_ipc (
                periode date,
                dernier_mois_commun date,
                poste varchar,
                libelle_poste varchar,
                fichier_source varchar,
                collecte_utc timestamptz,
                idbank_martinique varchar,
                idbank_france_metropolitaine varchar,
                facteur_martinique double,
                facteur_france_metropolitaine double,
                evolution_martinique_pct double,
                evolution_france_metropolitaine_pct double,
                differentiel_evolution_points double,
                coefficient_ecart double,
                ancre_ecsp_disponible boolean,
                ecart_ecsp_2022_pct double,
                ecart_prix_estime_pct double,
                source_ecsp varchar,
                nature_ecart varchar,
                valeur_indice double
            )
            """
        )
        for ligne in lignes:
            con.execute(
                """
                insert into fct_differentiel_ipc values (
                    ?::date, ?::date, ?, ?, ?, ?::timestamptz,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 999.0
                )
                """,
                [
                    ligne["periode"],
                    ligne["dernier_mois_commun"],
                    ligne["poste"],
                    ligne["libelle_poste"],
                    ligne["fichier_source"],
                    ligne["collecte_utc"],
                    ligne["idbank_martinique"],
                    ligne["idbank_france_metropolitaine"],
                    ligne["facteur_martinique"],
                    ligne["facteur_france_metropolitaine"],
                    ligne["evolution_martinique_pct"],
                    ligne["evolution_france_metropolitaine_pct"],
                    ligne["differentiel_evolution_points"],
                    ligne["coefficient_ecart"],
                    ligne["ancre_ecsp_disponible"],
                    ligne["ecart_ecsp_2022_pct"],
                    ligne["ecart_prix_estime_pct"],
                    ligne["source_ecsp"],
                    ligne["nature_ecart"],
                ],
            )
    con.close()
    return chemin_db


@pytest.fixture
def environnement(tmp_path: Path):
    dossier_data = tmp_path / "web" / "public" / "data"
    dossier_data.mkdir(parents=True)
    destination = dossier_data / "differentiel_ipc.parquet"
    destination.write_bytes(CONTENU_SAIN_SYNTHETIQUE)
    base = creer_base_synthetique(tmp_path / "build" / "panyen.duckdb")
    return {
        "tmp_path": tmp_path,
        "destination": destination,
        "base": base,
        "sha_sain": sha256(destination),
        "dossier_data": dossier_data,
    }


def _publier_succes(env, *, remplacer=None):
    return pub.publier(
        chemin_base=env["base"],
        chemin_destination=env["destination"],
        lancer_verification=lambda: 0,
        remplacer=remplacer,
    )


def test_echec_verify_conserve_parquet_sain_et_ne_lance_pas_export(environnement):
    env = environnement
    exporter = MagicMock()
    remplacer = MagicMock()

    with pytest.raises(pub.PublicationErreur, match="vérification"):
        pub.publier(
            chemin_base=env["base"],
            chemin_destination=env["destination"],
            lancer_verification=lambda: 1,
            exporter=exporter,
            remplacer=remplacer,
        )

    assert env["destination"].read_bytes() == CONTENU_SAIN_SYNTHETIQUE
    assert sha256(env["destination"]) == env["sha_sain"]
    exporter.assert_not_called()
    remplacer.assert_not_called()
    candidats = list(env["destination"].parent.glob("*"))
    assert candidats == [env["destination"]]


def test_table_absente_conserve_destination(environnement):
    env = environnement
    base_vide = env["tmp_path"] / "build" / "sans_table.duckdb"
    creer_base_synthetique(base_vide, creer_table=False)

    with pytest.raises(pub.PublicationErreur, match="table absente"):
        pub.publier(
            chemin_base=base_vide,
            chemin_destination=env["destination"],
            lancer_verification=lambda: 0,
        )

    assert sha256(env["destination"]) == env["sha_sain"]
    assert list(env["dossier_data"].glob(".*.parquet.tmp")) == []


def test_table_vide_conserve_destination(environnement):
    env = environnement
    base_vide = env["tmp_path"] / "build" / "table_vide.duckdb"
    creer_base_synthetique(base_vide, lignes=[])

    with pytest.raises(pub.PublicationErreur, match="table vide"):
        pub.publier(
            chemin_base=base_vide,
            chemin_destination=env["destination"],
            lancer_verification=lambda: 0,
        )

    assert sha256(env["destination"]) == env["sha_sain"]
    assert list(env["dossier_data"].glob(".*.parquet.tmp")) == []


def test_succes_sans_destination_anterieure(tmp_path: Path):
    dossier_data = tmp_path / "web" / "public" / "data"
    dossier_data.mkdir(parents=True)
    destination = dossier_data / "differentiel_ipc.parquet"
    base = creer_base_synthetique(tmp_path / "build" / "panyen.duckdb")

    resume = pub.publier(
        chemin_base=base,
        chemin_destination=destination,
        lancer_verification=lambda: 0,
    )

    assert destination.is_file()
    assert resume["n_lignes"] == 4
    assert resume["n_postes"] == 2
    assert resume["sha256"] == sha256(destination)
    assert list(dossier_data.glob(".*.parquet.tmp")) == []


def test_succes_remplace_seulement_apres_validation(environnement):
    env = environnement
    ordre: list[str] = []

    def exporter():
        ordre.append("exporter")
        return pub.exporter_candidat(
            chemin_base=env["base"],
            dossier_destination=env["dossier_data"],
        )

    def remplacer(src: Path, dst: Path) -> None:
        ordre.append("remplacer")
        assert src.is_file()
        assert dst.read_bytes() == CONTENU_SAIN_SYNTHETIQUE
        os.replace(src, dst)

    resume = pub.publier(
        chemin_base=env["base"],
        chemin_destination=env["destination"],
        lancer_verification=lambda: 0,
        exporter=exporter,
        remplacer=remplacer,
    )

    assert ordre == ["exporter", "remplacer"]
    assert env["destination"].read_bytes() != CONTENU_SAIN_SYNTHETIQUE
    assert resume["n_lignes"] == 4
    assert resume["n_postes"] == 2
    assert sha256(env["destination"]) == resume["sha256"]


def test_erreur_export_conserve_sha_sans_remplacement(environnement):
    env = environnement
    remplacer = MagicMock()

    def exporter_qui_echoue():
        raise pub.PublicationErreur("export invalide : simulé synthétique")

    with pytest.raises(pub.PublicationErreur, match="export invalide"):
        pub.publier(
            chemin_base=env["base"],
            chemin_destination=env["destination"],
            lancer_verification=lambda: 0,
            exporter=exporter_qui_echoue,
            remplacer=remplacer,
        )

    assert sha256(env["destination"]) == env["sha_sain"]
    remplacer.assert_not_called()
    assert list(env["dossier_data"].glob(".*.parquet.tmp")) == []


def test_erreur_validation_conserve_sha_et_nettoie_candidat(environnement):
    env = environnement
    remplacer = MagicMock()

    def exporter_casse():
        candidat = env["dossier_data"] / ".differentiel_ipc.brut.parquet.tmp"
        candidat.write_bytes(b"pas-un-parquet-valide")
        return candidat

    with pytest.raises(pub.PublicationErreur):
        pub.publier(
            chemin_base=env["base"],
            chemin_destination=env["destination"],
            lancer_verification=lambda: 0,
            exporter=exporter_casse,
            remplacer=remplacer,
        )

    assert sha256(env["destination"]) == env["sha_sain"]
    remplacer.assert_not_called()
    assert list(env["dossier_data"].glob(".*.parquet.tmp")) == []
    assert list(env["dossier_data"].glob("*")) == [env["destination"]]


def test_schema_ordre_poste_periode_et_contenu_identiques_a_la_fact(environnement):
    env = environnement
    resume = _publier_succes(env)

    con = duckdb.connect(str(env["base"]), read_only=True)
    source = con.execute(
        f"select {pub.LISTE_COLONNES_SQL} from fct_differentiel_ipc "
        "order by poste, periode"
    ).fetchall()
    colonnes_source = [c[0] for c in con.description]
    con.close()

    con = duckdb.connect()
    parquet = con.execute(
        f"select {pub.LISTE_COLONNES_SQL} from read_parquet(?) "
        "order by poste, periode",
        [str(env["destination"])],
    ).fetchall()
    colonnes_parquet = [c[0] for c in con.description]
    con.close()

    assert colonnes_parquet == list(pub.COLONNES_EXPORT)
    assert colonnes_parquet == colonnes_source
    assert parquet == source
    assert resume["periode_min"] == source[0][0]
    assert resume["periode_max"] == source[-1][0]
    assert resume["n_postes"] == 2


def test_absence_valeur_indice_et_presence_provenance(environnement):
    env = environnement
    _publier_succes(env)

    con = duckdb.connect()
    colonnes = [
        c[0]
        for c in con.execute(
            "describe select * from read_parquet(?)",
            [str(env["destination"])],
        ).fetchall()
    ]
    lignes = con.execute(
        "select dernier_mois_commun, fichier_source, collecte_utc, "
        "idbank_martinique, idbank_france_metropolitaine, source_ecsp, "
        "nature_ecart, ancre_ecsp_disponible from read_parquet(?) "
        "order by poste, periode",
        [str(env["destination"])],
    ).fetchall()
    con.close()

    assert "valeur_indice" not in colonnes
    assert set(colonnes) == set(pub.COLONNES_EXPORT)
    assert all(ligne[0] is not None for ligne in lignes)
    natures = {ligne[6] for ligne in lignes}
    assert "mesure_ecsp_2022" in natures
    assert None in natures


def test_refus_colonne_niveau_dans_export():
    assert "valeur_indice" not in pub.COLONNES_EXPORT


def test_os_replace_une_fois_succes_jamais_echec(environnement):
    env = environnement
    appels: list[tuple[Path, Path]] = []

    def compter_remplacer(src: Path, dst: Path) -> None:
        appels.append((src, dst))
        os.replace(src, dst)

    _publier_succes(env, remplacer=compter_remplacer)
    assert len(appels) == 1
    assert appels[0][1] == env["destination"]

    appels.clear()
    with pytest.raises(pub.PublicationErreur, match="vérification"):
        pub.publier(
            chemin_base=env["base"],
            chemin_destination=env["destination"],
            lancer_verification=lambda: 2,
            remplacer=compter_remplacer,
        )
    assert appels == []
