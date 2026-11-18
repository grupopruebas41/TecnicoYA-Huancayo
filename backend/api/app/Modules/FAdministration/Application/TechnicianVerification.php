<?php

namespace App\Modules\FAdministration\Application;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Panel del técnico, Fase T4: página de Verificación, solo para el propio técnico (D-106 y D-107).
 * - Una tarjeta por documento obligatorio con su estado: «Recibido» (pendiente y el perfil no está en la cola de
 *   revisión), «En revisión» (pendiente con el perfil en la cola), «Aprobado» u «Observado» (con la nota del revisor).
 * - El estado general es el mismo del menú (TechnicianHome), así el menú y la página nunca se contradicen.
 * - Los archivos solo los ven su dueño y quien tiene technicians.verify (MediaController); aquí solo se listan los
 *   del técnico de la sesión.
 */
final class TechnicianVerification
{
    /** Tipos válidos de «Tipo de documento»: los dos obligatorios de D-107 y uno opcional de respaldo. */
    public const TYPES = [
        ['value' => 'Documento de identidad', 'required' => 'identity', 'hint' => 'DNI o carné de extranjería, por ambos lados.'],
        ['value' => 'Certificado o constancia técnica', 'required' => 'certificate', 'hint' => 'Título, certificado o constancia de tu oficio.'],
        ['value' => 'Otro documento de respaldo', 'required' => null, 'hint' => 'Por ejemplo, una constancia de trabajo anterior.'],
    ];

    private const LABELS = ['received' => 'Recibido', 'in_review' => 'En revisión', 'approved' => 'Aprobado', 'observed' => 'Observado',
        'missing' => 'Falta subirlo', 'not_needed' => 'No requerido'];

    public function __construct(private readonly TechnicianHome $home) {}

    public function for(int $technicianId): array
    {
        $profile = DB::table('technician_profiles')->find($technicianId);
        $review = DB::table('technician_reviews')->where('technician_id', $technicianId)->orderByDesc('reviewed_at')->orderByDesc('id')->first();
        $inQueue = $profile->status === 'pending_verification' && $profile->verification_status === 'pending';
        $observation = $review && $review->decision !== 'approve' ? $review->reason : null;
        $documents = DB::table('technician_documents as d')->join('media_files as m', 'm.id', '=', 'd.media_id')
            ->where('d.technician_id', $technicianId)->orderByDesc('d.created_at')->orderByDesc('d.id')
            ->get(['d.id', 'd.document_type', 'd.review_status', 'd.review_note', 'd.media_id', 'd.created_at', 'm.original_name'])
            ->map(fn (object $row) => $this->present($row, $inQueue, $observation));

        $used = [];
        $required = [];
        foreach (TechnicianHome::REQUIRED_DOCUMENTS as $key => $definition) {
            $matching = $documents->filter(fn (array $document) => TechnicianHome::requiredKey($document['document_type']) === $key);
            $chosen = $matching->first(fn (array $document) => $document['review_status'] !== 'rejected') ?? $matching->first();
            if ($chosen) {
                $used[] = $chosen['id'];
            }
            $state = $chosen['state'] ?? ($profile->verification_status === 'approved' ? 'not_needed' : 'missing');
            $required[] = ['key' => $key, 'label' => $definition['label'], 'state' => $state, 'state_label' => self::LABELS[$state],
                'note' => $chosen['note'] ?? null, 'document' => $chosen];
        }
        $general = $this->home->verification($profile, $this->home->documents($technicianId));

        return [
            'state' => $general['state'], 'label' => $general['label'], 'missing' => $general['missing'],
            'in_queue' => $inQueue,
            'can_request_review' => $profile->status === 'pending_verification' && $profile->verification_status === 'rejected',
            'version' => (int) $profile->version,
            'last_review' => $review ? ['decision' => $review->decision, 'reason' => $review->reason,
                'reviewed_at' => Carbon::parse($review->reviewed_at)->toISOString()] : null,
            'required' => $required,
            'others' => $documents->reject(fn (array $document) => in_array($document['id'], $used, true))->values()->all(),
            'types' => array_map(fn (array $type) => ['value' => $type['value'], 'required' => $type['required'] !== null, 'hint' => $type['hint']], self::TYPES),
            'limits' => ['current' => $documents->where('review_status', '!=', 'rejected')->count(), 'max' => TechnicianDocuments::MAX_CURRENT,
                'max_bytes' => 5 * 1024 * 1024, 'accept' => ['application/pdf', 'image/jpeg', 'image/png']],
        ];
    }

    private function present(object $row, bool $inQueue, ?string $observation): array
    {
        $state = match ($row->review_status) {
            'approved' => 'approved',
            'rejected' => 'observed',
            default => $inQueue ? 'in_review' : 'received',
        };

        return [
            'id' => (int) $row->id, 'document_type' => $row->document_type, 'file_name' => $row->original_name,
            'uploaded_at' => Carbon::parse($row->created_at)->toISOString(), 'review_status' => $row->review_status,
            'state' => $state, 'state_label' => self::LABELS[$state],
            'note' => $state === 'observed' ? ($row->review_note ?: $observation) : null,
            'url' => url("/api/v1/media/{$row->media_id}"),
        ];
    }
}
