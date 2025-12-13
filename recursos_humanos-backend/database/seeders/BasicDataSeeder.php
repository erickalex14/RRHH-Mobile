<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\EmployeeState;

class BasicDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear roles básicos
        Role::create([
            'name' => 'Administrador',
            'description' => 'Rol con acceso completo al sistema',
            'salary' => '1500.00',
            'admin' => true,
        ]);

        Role::create([
            'name' => 'Empleado',
            'description' => 'Rol de empleado estándar',
            'salary' => '800.00',
            'admin' => false,
        ]);

        // Crear estados de empleado
        EmployeeState::create([
            'name' => 'Activo',
            'description' => 'Empleado trabajando actualmente',
        ]);

        EmployeeState::create([
            'name' => 'Inactivo',
            'description' => 'Empleado no disponible o suspendido',
        ]);

        EmployeeState::create([
            'name' => 'Vacaciones',
            'description' => 'Empleado en periodo de vacaciones',
        ]);
    }
}
