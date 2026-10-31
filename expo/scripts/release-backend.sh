#!/bin/zsh
# Ships the backend half of the Free/Pro + auth + universities release to the
# linked Supabase project (yagdgijrdlifgcjkcnqe). Safe to re-run.
set -euo pipefail
cd "$(dirname "$0")/.."
REF=yagdgijrdlifgcjkcnqe

echo "1/5  Database migrations (security hardening: documents RLS, content RLS, private billing view)"
supabase db push --linked

echo "2/5  Edge functions"
# generate-journey: university directory + details-page research
# interview-feedback: unlimited sessions for every paid plan
# revenuecat-webhook: Free/Pro tiers, and expirations now really downgrade
supabase functions deploy generate-journey interview-feedback revenuecat-webhook --project-ref "$REF"

echo "3/5  (Luka's plan was restored on 2026-10-29)"

echo "4/5  Paid profiles whose subscription already expired (left paid by the old webhook)"
supabase db query --linked \
  "select email, subscription_tier, subscription_expires_at from profiles where subscription_tier <> 'free' and subscription_expires_at < now();"
echo "     Review the list above. To move them to Free, run:"
echo "     supabase db query --linked \"update profiles set subscription_tier = 'free' where subscription_tier <> 'free' and subscription_expires_at < now();\""

echo "5/5  Import every university of the destination countries"
SRK=$(supabase projects api-keys --project-ref "$REF" -o json | node -e 'const k=JSON.parse(require("fs").readFileSync(0,"utf8"));console.log(k.find(x=>x.name==="service_role").api_key)')
curl -s -X POST "https://$REF.supabase.co/functions/v1/generate-journey" \
  -H "Authorization: Bearer $SRK" -H "x-internal-key: $SRK" -H "Content-Type: application/json" \
  -d '{"action":"directory"}'
echo
echo "Done."
