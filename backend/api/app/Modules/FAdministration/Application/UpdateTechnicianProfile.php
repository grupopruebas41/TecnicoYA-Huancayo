<?php

namespace App\Modules\FAdministration\Application;

use App\Models\User;
use Illuminate\Support\Facades\DB;

/** Bio y años de experiencia del técnico de la sesión, con control de versión (HU-S02-05). */
final class UpdateTechnicianProfile
{
    public function __construct(private readonly OwnTechnicianProfile $profiles) {}

    public function execute(User $user, array $data): int
    {
        return DB::transaction(function () use ($user, $data) {
            $profile = $this->profiles->lockFor($user, (int) $data['expected_version']);
            DB::table('technician_profiles')->where('id', $profile->id)
                ->update(array_intersect_key($data, array_flip(['bio', 'experience_years'])));
            $this->profiles->bumpVersion($profile);

            return $profile->id;
        });
    }
}
