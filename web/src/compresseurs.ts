/**
 * Décompresseurs Parquet. Tous les fichiers publiés sont en Zstandard
 * (`publication/`) : on ne charge que celui-là, au lieu du paquet complet
 * (brotli, gzip, lz4, snappy), ce qui allège le code de la page. Un fichier
 * dans un autre codec fait échouer la lecture, bruyamment.
 */
import { decompress } from "fzstd";
import type { Compressors } from "hyparquet";

export const compresseurs: Compressors = {
  ZSTD: (entree: Uint8Array) => decompress(entree),
};
