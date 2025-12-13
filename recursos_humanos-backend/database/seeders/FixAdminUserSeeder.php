<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\EmployeeState;
use App\Models\EmployeeDetail;
use App\Models\Role;
use App\Models\Department;
use App\Models\Schedule;

class FixAdminUserSeeder extends Seeder
{
    /**
     * Regenera el usuario administrador con todos los permisos necesarios.
     */    public function run(): void
    {
        // Eliminar el detalle del empleado primero para evitar restricciones de clave foránea
        $adminUser = User::where('email', 'admin@example.com')->first();
        if ($adminUser) {
            // Eliminar los detalles asociados primero
            EmployeeDetail::where('user_id', $adminUser->user_id)->delete();
            // Luego eliminar el usuario
            $adminUser->delete();
        }
        
        // Asegúrate de que exista al menos un estado de empleado
        $activeState = EmployeeState::firstOrCreate(
            ['name' => 'Activo'],
            [
                'description' => 'Empleado en estado activo',
                'active' => true
            ]
        );

        // Crear un rol de administrador
        $adminRole = Role::firstOrCreate(
            ['name' => 'Administrador'],
            [
                'description' => 'Rol con permisos administrativos',
                'salary' => '3000.00',
                'admin' => true,
                'created_by' => null
            ]
        );

        // Crear un departamento por defecto
        $department = Department::firstOrCreate(
            ['name' => 'Administración'],
            [
                'description' => 'Departamento de administración general',
                'created_by' => null
            ]
        );
        
        // Crear un horario por defecto
        $schedule = Schedule::firstOrCreate(
            ['name' => 'Horario administrativo'],
            [
                'start_time' => '09:00:00',
                'end_time' => '18:00:00',
                'lunch_start' => '13:00:00',
                'lunch_end' => '14:00:00',
                'active' => true,
                'created_by' => null
            ]
        );

        // Crear usuario administrador con contraseña conocida
        $admin = User::create([
            'email' => 'admin@example.com',
            'first_name' => 'Admin',
            'last_name' => 'Sistema',
            'password' => Hash::make('admin123'),
            'employee_state_id' => $activeState->employee_state_id,
            'created_by' => null
        ]);

        // Actualizar la referencia circular después de crear el usuario
        $adminRole->created_by = $admin->user_id;
        $adminRole->save();
        
        $department->created_by = $admin->user_id;
        $department->save();
        
        $schedule->created_by = $admin->user_id;
        $schedule->save();
        
        // Crear detalles del empleado administrador
        EmployeeDetail::create([
            'user_id' => $admin->user_id,
            'role_id' => $adminRole->role_id,
            'department_id' => $department->department_id,
            'schedule_id' => $schedule->schedule_id,
            'national_id' => 'ADMIN0001',
            'address' => 'Dirección Administrativa',
            'phone' => '1234567890',
            'hire_date' => now(),
            'birth_date' => now()->subYears(30),
            'created_by' => $admin->user_id
        ]);        $this->command->info('Usuario administrador recreado correctamente!');
        $this->command->info('Email: admin@example.com');
        $this->command->info('Password: admin123');
    }
}
