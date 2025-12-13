<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\EmployeeState;
use App\Models\EmployeeDetails;
use App\Models\Schedules;
use App\Models\Company;
use App\Models\Branch;
use App\Models\Department;
use App\Models\Role;
use App\Models\Document;
use App\Models\WorkSession;
use App\Models\EarlyDepartureRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class UserController extends Controller
{
    /**
     * Muestra una lista de los usuarios.
     */
    public function index()
    {
        //
        $users = User::with(
            'employeeState', 
            'employeeDetail.schedule', 
            'employeeDetail.department', 
            'employeeDetail.role', 
            'employeeDetail.department.branch',
            'employeeDetail.department.branch.company',
            'createdBy'
            )->get();
        if ($users->isEmpty()) {
            return response()->json([
                'status' => false,
                'message' => 'No se encontraron usuarios',
                'data' => []
            ], 404);
        }
        return response()->json([
            'status' => true,
            'message' => 'Lista de usuarios',
            'data' => $users
        ], 200);
    }

    /**
     * Ver un usuario por id.
     */

    public function show($id)
    {
        try {
            $user = User::with(
                'employeeState', 
                'employeeDetail.schedule', 
                'employeeDetail.department', 
                'employeeDetail.role', 
                'employeeDetail.department.branch',
                'employeeDetail.department.branch.company'
            )->findOrFail($id);
            return response()->json([
                'status' => true,
                'message' => 'Usuario encontrado',
                'data' => $user
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Usuario no encontrado',
            ], 404);
        }
    }
    /**
     * Almacena un nuevo usuario.
     */
    public function store(Request $request)
    {
        // Validar datos de entrada para el usuario y detalles del empleado
        $validated = $request->validate([
            // Datos del usuario
            'employee_state_id' => 'required|exists:employee_states,employee_state_id',
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            // Datos del detalle del empleado
            'role_id' => 'required|exists:roles,role_id',
            'department_id' => 'required|exists:departments,department_id',
            'schedule_id' => 'required|exists:schedules,schedule_id',
            'national_id' => 'required|string|max:10|unique:employee_details,national_id',
            'address' => 'required|string|max:100',
            'phone' => 'required|string|max:10',
            'hire_date' => 'required|date',
            'birth_date' => 'required|date|before:hire_date',
        ]);

        try {
            // Iniciar transacción
            \DB::beginTransaction();

            // Crear nuevo usuario
            $user = User::create([
                'employee_state_id' => $validated['employee_state_id'],
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'created_by' => $request->user()->user_id, // El usuario autenticado es quien crea
            ]);

            // Crear detalle del empleado
            $employeeDetail = $user->employeeDetail()->create([
                'role_id' => $validated['role_id'],
                'department_id' => $validated['department_id'],
                'schedule_id' => $validated['schedule_id'],
                'national_id' => $validated['national_id'],
                'address' => $validated['address'],
                'phone' => $validated['phone'],
                'hire_date' => $validated['hire_date'],
                'birth_date' => $validated['birth_date'],
                'created_by' => $request->user()->user_id,
            ]);

            \DB::commit();

            // Cargar las relaciones necesarias
            $user->load([
                'employeeState',
                'employeeDetail.schedule',
                'employeeDetail.department',
                'employeeDetail.role',
                'employeeDetail.department.branch',
                'employeeDetail.department.branch.company'
            ]);

            // Retornar respuesta
            return response()->json([
                'status' => true,
                'message' => 'Usuario creado exitosamente',
                'data' => $user
            ], 201);

        } catch (\Exception $e) {
            \DB::rollback();
            return response()->json([
                'status' => false,
                'message' => 'Error al crear el usuario: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualiza un usuario existente.
     */
    public function update(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);

            // Validar datos de entrada
            $validated = $request->validate([
                'employee_state_id' => 'sometimes|exists:employee_states,employee_state_id',
                'first_name' => 'sometimes|string|max:100',
                'last_name' => 'sometimes|string|max:100',
                'email' => ['sometimes', 'email', Rule::unique('users')->ignore($user->user_id, 'user_id')],
                'password' => 'sometimes|string|min:8',
            ]);

            // Hashear la contraseña si se proporciona una nueva
            if (isset($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            }

            // Actualizar usuario
            $user->update($validated);

            return response()->json([
                'status' => true,
                'message' => 'Usuario actualizado exitosamente',
                'data' => $user
            ], 200);

        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Usuario no encontrado.'], 404);
        }
    }



    /**
     * Eliminar un usuario por id.
     */
    public function destroy($id)
    {
        try {
            $user = User::findOrFail($id);
            $user->delete();

            return response()->json([
                'status' => true,
                'message' => 'Usuario eliminado exitosamente',
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Usuario no encontrado.'], 404);
        }
    }
}
