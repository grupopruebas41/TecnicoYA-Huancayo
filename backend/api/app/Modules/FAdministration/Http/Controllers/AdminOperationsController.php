<?php

namespace App\Modules\FAdministration\Http\Controllers;

use App\Modules\BMatching\Http\Controllers\OfferController;
use App\Modules\FAdministration\Application\AdminMatchingBoard;
use App\Modules\FAdministration\Application\AdminRequests;
use App\Modules\FAdministration\Application\OperationalAlerts;
use App\Modules\FAdministration\Application\RequestIntervention;
use App\Shared\Audit\AuditTrail;
use App\Shared\Auth\EffectivePermissions;
use App\Shared\Http\ApiResponse;
use App\Shared\Http\Idempotency;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Fase A3 del panel del administrador: intervención de D-116 (requests.intervene), CSV de Solicitudes, emparejamiento en
 * vivo y alertas operativas (dashboard.view). Contrato S07 §12.
 */
final class AdminOperationsController
{
    private const LABELS = ['registered' => 'Borrador', 'sent' => 'Enviada', 'pending_availability' => 'Pendiente de disponibilidad',
        'assigned' => 'Asignada', 'in_progress' => 'En curso', 'completed' => 'Completada', 'closed' => 'Cerrada',
        'unrated' => 'Sin calificar', 'cancelled' => 'Cancelada', 'expired' => 'Vencida'];

    public function request(Request $request, int $serviceRequest, AdminRequests $requests, EffectivePermissions $permissions): JsonResponse
    {
        return ApiResponse::data($requests->detail($serviceRequest, $permissions->allows($request->user(), RequestIntervention::PERMISSION)));
    }

    public function cancel(Request $request, int $serviceRequest, RequestIntervention $intervention, Idempotency $idempotency): JsonResponse
    {
        $data = $this->validated($request);

        return OfferController::render($idempotency->run($request->user(), "admin.request.cancel:$serviceRequest", $this->key($request), $data,
            fn () => $intervention->cancel($request->user(), $serviceRequest, $data)));
    }

    public function rematch(Request $request, int $serviceRequest, RequestIntervention $intervention, Idempotency $idempotency): JsonResponse
    {
        $data = $this->validated($request);

        return OfferController::render($idempotency->run($request->user(), "admin.request.rematch:$serviceRequest", $this->key($request), $data,
            fn () => $intervention->rematch($request->user(), $serviceRequest, $data)));
    }

    /**
     * CSV de la vista filtrada: UTF-8 con BOM, separador «;» y fin de línea CRLF (Excel en español). Sin datos personales
     * del cliente. Las celdas que empiezan con =, +, -, @, tabulador o retorno se prefijan con «'» (inyección de fórmulas).
     */
    public function export(Request $request, AdminRequests $requests, AuditTrail $audit): StreamedResponse
    {
        $filters = array_filter(AdminInsightsController::requestFilters($request), fn ($value) => $value !== null && $value !== '');
        unset($filters['page'], $filters['per_page']);
        $rows = $requests->exportRows($filters);
        $truncated = count($rows) > AdminRequests::EXPORT_LIMIT;
        $rows = array_slice($rows, 0, AdminRequests::EXPORT_LIMIT);
        $audit->record($request->user(), 'requests.exported', 'dashboard.view', 'service_request', null, 'Exportación CSV de Solicitudes.',
            [], ['filters' => $filters, 'rows' => count($rows), 'truncated' => $truncated]);
        $lines = [['Número', 'Estado', 'Especialidad', 'Subcategoría', 'Distrito', 'Técnico', 'Creada', 'Enviada']];
        foreach ($rows as $row) {
            $lines[] = [(string) $row['id'], self::LABELS[$row['status']] ?? $row['status'], $row['specialty'], $row['subcategory'], $row['district'],
                $row['technician']['name'] ?? '', $row['created_at'], $row['submitted_at'] ?? ''];
        }
        $csv = "\u{FEFF}".implode("\r\n", array_map(fn (array $line) => implode(';', array_map([self::class, 'cell'], $line)), $lines))."\r\n";

        return response()->streamDownload(fn () => print ($csv), 'solicitudes-'.now()->format('Y-m-d').'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8', 'X-Export-Truncated' => $truncated ? '1' : '0', 'Cache-Control' => 'no-store',
        ]);
    }

    public function live(AdminMatchingBoard $board): JsonResponse
    {
        return ApiResponse::data($board->snapshot());
    }

    public function alerts(Request $request, OperationalAlerts $alerts, EffectivePermissions $permissions): JsonResponse
    {
        $items = $alerts->items($permissions->allows($request->user(), RequestIntervention::PERMISSION));

        return ApiResponse::data(['available' => $items !== null, 'items' => $items ?? [], 'generated_at' => now()->toISOString()]);
    }

    /** Celda de CSV: neutraliza fórmulas y escapa comillas, separadores y saltos de línea. */
    public static function cell(?string $value): string
    {
        $value = (string) $value;
        if ($value !== '' && in_array($value[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
            $value = "'".$value;
        }

        return preg_match('/[;"\r\n]/', $value) ? '"'.str_replace('"', '""', $value).'"' : $value;
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'reason' => ['required', 'string', 'min:10', 'max:500'],
            'expected_version' => ['required', 'integer', 'min:1'],
        ], ['reason.*' => __('api.intervention_reason')]);
    }

    private function key(Request $request): string
    {
        $key = (string) $request->header('Idempotency-Key');
        if ($key === '' || strlen($key) > 255) {
            throw ValidationException::withMessages(['idempotency_key' => __('api.idempotency_key_required')]);
        }

        return $key;
    }
}
