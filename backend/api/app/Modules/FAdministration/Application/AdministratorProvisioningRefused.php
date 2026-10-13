<?php

namespace App\Modules\FAdministration\Application;

use RuntimeException;

/** El alta por consola no procede: rol administrador inactivo o cuenta ya existente. */
final class AdministratorProvisioningRefused extends RuntimeException {}
