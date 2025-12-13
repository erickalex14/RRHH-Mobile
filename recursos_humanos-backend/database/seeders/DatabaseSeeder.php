<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\EmployeeState;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Ejecutar el seeder para crear usuario administrador
        $this->call([
            AdminUserSeeder::class,
        ]);
        
        // Crear estado de empleado activo
        $activeState = EmployeeState::firstOrCreate(
            ['name' => 'Activo'],
            [
                'description' => 'Empleado activo en la empresa',
                'active' => true
            ]
        );

        // Crear usuario administrador primero
        $admin = User::create([
            'employee_state_id' => $activeState->employee_state_id,
            'first_name' => 'Admin',
            'last_name' => 'Sistema',
            'email' => 'admin@example.com',
            'password' => Hash::make('password123')
        ]);

        // Crear rol de administrador
        $adminRole = Role::create([
            'name' => 'Administrador',
            'description' => 'Rol con todos los permisos del sistema',
            'salary' => '2000.00',
            'admin' => true,
            'created_by' => $admin->user_id
        ]);

        // Crear compañía matriz
        $company = \App\Models\Company::create([
            'name' => 'Empresa Matriz',
            'ruc' => '1234567890001',
            'address' => 'Dirección Principal',
            'phone' => '0987654321',
            'email' => 'empresa@example.com',
            'created_by' => $admin->user_id
        ]);

        // Crear sucursal principal
        $branch = \App\Models\Branch::create([
            'company_id' => $company->company_id,
            'name' => 'Sucursal Principal',
            'code' => 'SUC-001',
            'address' => 'Dirección Sucursal',
            'city' => 'Ciudad Principal',
            'state' => 'Estado',
            'country' => 'País',
            'phone' => '0987654321',
            'email' => 'sucursal@example.com',
            'matrix' => true,
            'created_by' => $admin->user_id
        ]);

        // Crear departamento de administración
        $department = \App\Models\Department::create([
            'branch_id' => $branch->branch_id,
            'name' => 'Administración',
            'created_by' => $admin->user_id
        ]);

        // Crear horario administrativo
        $schedule = \App\Models\Schedule::create([
            'name' => 'Horario Administrativo',
            'start_time' => '08:00',
            'end_time' => '17:00',
            'lunch_start' => '13:00',
            'lunch_end' => '14:00',
            'active' => true,
            'created_by' => $admin->user_id
        ]);

        // Crear detalle del empleado admin
        $admin->employeeDetail()->create([
            'role_id' => $adminRole->role_id,
            'department_id' => $department->department_id,
            'schedule_id' => $schedule->schedule_id,
            'national_id' => '1234567890',
            'address' => 'Dirección Administrativa',
            'phone' => '0987654321',
            'hire_date' => now(),
            'birth_date' => now()->subYears(30)
        ]);
    }
}
