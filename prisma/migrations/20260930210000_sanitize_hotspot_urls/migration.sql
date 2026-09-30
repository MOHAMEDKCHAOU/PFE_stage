-- Nettoyage des liens de hotspots Smart Space enregistrés avant la validation (src/lib/safe-url.ts).
-- Liste blanche alignée sur parseSafeUrl : tout lien non conforme est retiré (le hotspot est conservé).
--   https://hôte… / http://hôte…  (sans identifiants "user@", ni espace, contrôle ou antislash)
--   mailto:…, tel:…, chemin interne "/…" (mais pas "//…")
-- chr(92) = antislash (évite les ambiguïtés d’échappement dans les expressions régulières).
UPDATE "SmartSpaceHotspot"
SET "targetUrl" = NULL
WHERE "targetUrl" IS NOT NULL
  AND (
    "targetUrl" ~ '[[:space:][:cntrl:]]'
    OR strpos("targetUrl", chr(92)) > 0
    OR length("targetUrl") > 800
    OR NOT (
      "targetUrl" ~* '^https?://[^/?#@:]+(:[0-9]+)?([/?#]|$)'
      OR "targetUrl" ~* '^mailto:.+'
      OR "targetUrl" ~* '^tel:[+]?[0-9().-]{3,32}$'
      OR ("targetUrl" ~ '^/' AND "targetUrl" !~ '^//')
    )
  );

-- Les hotspots de lien devenus sans cible repassent en INFO (affichés comme texte, sans lien).
UPDATE "SmartSpaceHotspot"
SET "type" = 'INFO'
WHERE "targetUrl" IS NULL AND "type" IN ('LINK', 'CTA', 'VIDEO');
