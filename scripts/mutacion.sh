#!/usr/bin/env bash
# DEF-46 · Mutación reproducible en Linux (job «Mutación» de .github/workflows/mutacion.yml o un contenedor Linux).
# En Windows el plugin lanzaba cada mutante con --filter="A|B" y cmd tomaba el «|» como tubería; además cada mutante
# repetía migrate:fresh y el corte por tiempo contaba como eliminado. Aquí se migra una sola vez
# (TECNICOYA_MUTATION_MIGRATED=1, tests/bootstrap.php) y, antes de medir, un control negativo debe dejar
# sobrevivientes: si todo sale «eliminado», la corrida no es confiable y el script falla.
#
# Uso (desde la raíz, con PHP + PCOV y la base *_testing del entorno):  bash scripts/mutacion.sh control|s03|s04 [salida]
set -euo pipefail
sprint="${1:?Indica control, s03 o s04}"
out="${2:-backend/api/test-results/mutacion-$sprint.txt}"
cd "$(dirname "$0")/../backend/api"
case "$DB_DATABASE" in *_testing) ;; *) echo "Base no permitida: $DB_DATABASE (DEF-44/45)" >&2; exit 2 ;; esac
mkdir -p "$(dirname "../../$out")" 2>/dev/null || true
out="$(cd "$(dirname "../../$out")" && pwd)/$(basename "$out")"

join() { local IFS=,; echo "$*"; }

case "$sprint" in
  control)
    tests=(tests/Feature/Sprint04/EligibilityTest.php)
    paths=(app/Modules/BMatching/Domain/Scorer.php)
    ;;
  s03) # Las 10 clases nuevas o modificadas del S3 (evidencias/sprint-03/04-mutacion.txt)
    tests=(tests/Feature/Sprint02 tests/Feature/Sprint03)
    paths=(app/Modules/ARequests/Application/ManageServiceRequests.php app/Modules/ARequests/Application/SubmissionPolicy.php
      app/Modules/ARequests/Http/Requests/StoreServiceRequestRequest.php app/Modules/ARequests/Http/Requests/UpdateServiceRequestRequest.php
      app/Modules/FAdministration/Application/StoreMedia.php app/Modules/FAdministration/Http/Requests/StoreMediaRequest.php
      app/Modules/BMatching/Application/TechnicianSearch.php app/Modules/BMatching/Http/Requests/SearchTechniciansRequest.php
      app/Modules/BMatching/Http/Controllers/TechnicianSearchController.php app/Shared/Rules/RuleBook.php)
    ;;
  s04) # Las 30 clases del S4 (evidencias/sprint-04/04-mutacion.txt). Sin las pruebas de concurrencia con procesos
       # reales (040, 045, 046), las herramientas E2E ni la guarda de comandos, que no corren dentro de una transacción.
    tests=(tests/Unit/Sprint04)
    for file in tests/Feature/Sprint04/*Test.php; do
      case "$(basename "$file")" in OfferConcurrencyTest.php|SelectionConcurrencyTest.php|E2ESupportTest.php|DestructiveCommandGuardTest.php) ;; *) tests+=("$file") ;; esac
    done
    tests+=(tests/Feature/Sprint03/RequestIdempotencyTest.php tests/Feature/Sprint03/TC037IdempotentSubmissionTest.php tests/Feature/Sprint03/ActiveRequestLimitTest.php)
    paths=(app/Console/Commands/Sweep.php app/Http/Middleware/RejectSuspendedTechnician.php
      app/Modules/ARequests/Application/ServiceRequestView.php app/Modules/ARequests/Http/Controllers/ServiceRequestController.php
      app/Modules/BMatching/Application/CandidatesView.php app/Modules/BMatching/Application/ClientSelection.php
      app/Modules/BMatching/Application/Eligibility.php app/Modules/BMatching/Application/Matcher.php
      app/Modules/BMatching/Application/MatchingFlow.php app/Modules/BMatching/Application/MatchingRules.php
      app/Modules/BMatching/Application/OfferResponses.php app/Modules/BMatching/Application/OfferView.php
      app/Modules/BMatching/Application/OwnTechnician.php app/Modules/BMatching/Application/RequestProgress.php
      app/Modules/BMatching/Application/RoundOpener.php app/Modules/BMatching/Application/SearchState.php
      app/Modules/BMatching/Application/TechnicianHistory.php app/Modules/BMatching/Domain/Ranker.php
      app/Modules/BMatching/Domain/Scorer.php app/Modules/BMatching/Http/Controllers/OfferController.php
      app/Modules/BMatching/Http/Controllers/SelectionController.php app/Modules/CNotifications/Application/Inbox.php
      app/Modules/CNotifications/Application/MailSandboxChannel.php app/Modules/CNotifications/Application/NotificationDelivery.php
      app/Modules/CNotifications/Application/Outbox.php app/Modules/CNotifications/Application/OutboxPublisher.php
      app/Modules/CNotifications/Http/Controllers/NotificationController.php app/Modules/FAdministration/Application/RetireEvidence.php
      app/Shared/Http/Idempotency.php app/Shared/Rules/RuleBook.php)
    ;;
  *) echo "Indica control, s03 o s04" >&2; exit 2 ;;
esac

php artisan migrate:fresh --force --no-ansi >/dev/null
export TECNICOYA_MUTATION_MIGRATED=1
{
  echo "# Mutación $sprint · $(date -u +%Y-%m-%dT%H:%MZ) · commit $(git rev-parse --short HEAD) · $(uname -s) · PHP $(php -r 'echo PHP_VERSION;')"
  echo "# Pruebas: ${tests[*]}"
  echo "# Clases: $(join "${paths[@]}")"
} > "$out"
set +e
php -d pcov.enabled=1 -d pcov.directory=. vendor/bin/pest "${tests[@]}" --mutate --everything --clear-cache \
  --path="$(join "${paths[@]}")" --colors=never 2>&1 | tee -a "$out"
code=${PIPESTATUS[0]}
set -e
summary="$(grep -E '^\s*Mutations:' "$out" | tail -1)"
echo "# Resumen: ${summary:-sin resumen} · código $code" >> "$out"
[ -n "$summary" ] || { echo "La mutación no terminó (sin resumen)." >&2; exit 1; }
if [ "$sprint" = control ] && ! grep -qE 'Mutations:.*untested' "$out"; then
  echo "Control negativo FALLIDO: no hay sobrevivientes al mutar Scorer solo con EligibilityTest (DEF-46)." >&2
  exit 1
fi
