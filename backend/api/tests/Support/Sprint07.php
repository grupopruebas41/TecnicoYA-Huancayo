<?php

namespace Tests\Support;

use Database\Seeders\CatalogSeeder;
use Database\Seeders\DistrictSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Datos sintéticos del adelanto del Sprint 7 (D-73): registro detallado (D-80) y recuperación de contraseña.
 */
final class Sprint07
{
    /** Distritos de D-15 y catálogo inicial; ambos seeders son idempotentes. */
    public static function catalog(): void
    {
        app(DistrictSeeder::class)->run();
        app(CatalogSeeder::class)->run();
    }

    public static function districtId(string $code = 'HUANCAYO'): int
    {
        return (int) DB::table('districts')->where('code', $code)->value('id');
    }

    public static function specialtyId(string $code = 'computo'): int
    {
        return (int) DB::table('specialties')->where('code', $code)->value('id');
    }

    /** Campos comunes a cliente y técnico (D-80). */
    private static function common(string $accountType): array
    {
        $password = Str::password(32);

        return [
            'given_names' => 'Ana Lucía', 'family_names' => 'Quispe Rojas',
            'email' => Str::uuid().'@example.test', 'phone' => '987654321',
            'password' => $password, 'password_confirmation' => $password,
            'account_type' => $accountType, 'terms_accepted' => true,
        ];
    }

    public static function clientPayload(array $overrides = []): array
    {
        self::catalog();

        return array_merge(self::common('client'), [
            'client_type' => 'household', 'district_id' => self::districtId(),
        ], $overrides);
    }

    public static function technicianPayload(array $overrides = []): array
    {
        self::catalog();

        return array_merge(self::common('technician'), [
            'base_district_id' => self::districtId('EL-TAMBO'),
            'district_ids' => [self::districtId('HUANCAYO')],
            'specialty_ids' => [self::specialtyId('computo')],
            'experience_years' => 4,
        ], $overrides);
    }
}
