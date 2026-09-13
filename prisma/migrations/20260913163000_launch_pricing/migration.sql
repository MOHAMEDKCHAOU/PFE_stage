-- Launch pricing hypothesis for Faymoos Premium 2026.
-- Prices remain configurable in Stripe; this table powers the demo/catalogue UI.
INSERT INTO "SubscriptionPlanPrice" ("planKey", "name", "description", "monthlyCents", "yearlyCents", "currency", "sortOrder", "updatedAt") VALUES
  ('FREE', 'Free', 'Try Faymoos with limited AI and one Smart Scan.', 0, 0, 'EUR', 0, NOW()),
  ('PRO', 'Pro', 'Independent professionals: premium presence, AI, analytics and Smart Spaces.', 1900, 19000, 'EUR', 1, NOW()),
  ('STUDIO', 'Studio', 'Agencies: managed clients, reporting, AI and 12 Smart Scans per month.', 6900, 69000, 'EUR', 2, NOW()),
  ('STUDIO_PLUS', 'Studio+', 'Higher-volume agencies with larger client, AI and Smart Scan limits.', 17900, 179000, 'EUR', 3, NOW())
ON CONFLICT ("planKey") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "monthlyCents" = EXCLUDED."monthlyCents",
  "yearlyCents" = EXCLUDED."yearlyCents",
  "currency" = EXCLUDED."currency",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();
