<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Branch;
use App\Models\Company;
use App\Models\Document;
use App\Models\EmployeeDetail;
use App\Models\EmployeeState;
use App\Models\Role;
use App\Models\User;
use App\Models\Schedules;
use App\Models\WorkSession;
use App\Models\EarlyDepartureRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class EmployeeDetailController extends Controller
{
    /**
     * Muestra una lista de los detalles de empleados.
     */
    public function index()
    {
        $employeeDetails = EmployeeDetail::with('user','user.employeeState', 'department.branch', 'department.branch.company', 'role', 'schedule')
            ->get();

        if ($employeeDetails->isEmpty()) {
            return response()->json([
                'status' => false,
                'message' => 'No se encontraron detalles de empleados',
                'data' => []
            ], 404);
        }

        return response()->json([
            'status' => true,
            'message' => 'Lista de detalles de empleados',
            'data' => $employeeDetails
        ], 200);
    }


    /**
     * Guarda un nuevo detalle de empleado.
     */
    public function store(Request $request)
    {
        //
        try {
            $request->validate([
                'user_id' => 'required|exists:users,user_id',
                'department_id' => 'required|exists:departments,department_id',
                'role_id' => 'required|exists:roles,role_id',
                'schedule_id' => 'nullable|exists:schedules,schedule_id',
                'national_id' => 'required|string|max:20',
                'address' => 'required|string|max:255',
                'phone' => 'required|string|max:15',
                'hire_date' => 'required|date',
                'birth_date' => 'required|date|before:hire_date',
                'created_by' => 'nullable|exists:users,user_id',
            ]);

            $employeeDetail = EmployeeDetail::create($request->all());

            return response()->json([
                'status' => true,
                'message' => 'Detalle de empleado creado con éxito',
                'data' => $employeeDetail
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error al crear el detalle de empleado: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Muestra el detalle de un empleado por ID.
     */
    public function show($id)
    {
        //
        try {
            $employeeDetail = EmployeeDetail::with(
                'user', 
                'user.employeeState', 
                'department.branch', 
                'department.branch.company', 
                'role', 
                'schedule'
            )->findOrFail($id);

            return response()->json([
                'status' => true,
                'message' => 'Detalle de empleado encontrado',
                'data' => $employeeDetail
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Detalle de empleado no encontrado',
            ], 404);
        }
    }

    /**
     * Actualiza el detalle de un empleado por ID.
     */
    public function update(Request $request, $id)
    {
        //
        try {
            $employeeDetail = EmployeeDetail::findOrFail($id);

            $request->validate([
                'user_id' => 'sometimes|exists:users,user_id',
                'department_id' => 'sometimes|exists:departments,department_id',
                'branch_id' => 'sometimes|exists:branches,branch_id',
                'company_id' => 'sometimes|exists:companies,company_id',
                'role_id' => 'sometimes|exists:roles,role_id',
                'national_id' => 'sometimes|string|max:20',
                'salary' => 'sometimes|numeric|min:0',
                'address' => 'sometimes|string|max:255',
                'phone' => 'sometimes|string|max:15',
                'hire_date' => 'sometimes|date',
                'birth_date' => 'sometimes|date|before:hire_date',
            ]);

            $employeeDetail->update($request->all());

            return response()->json([
                'status' => true,
                'message' => 'Detalle de empleado actualizado con éxito',
                'data' => $employeeDetail
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Detalle de empleado no encontrado',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error al actualizar el detalle de empleado: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Elimina un detalle de empleado por ID.
     */
    public function destroy($id)
    {
        //
        try {
            $employeeDetail = EmployeeDetail::findOrFail($id);
            $employeeDetail->delete();

            return response()->json([
                'status' => true,
                'message' => 'Detalle de empleado eliminado con éxito',
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Detalle de empleado no encontrado',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error al eliminar el detalle de empleado: ' . $e->getMessage(),
            ], 500);
        }
    }
}
