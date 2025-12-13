<?php

namespace App\Http\Controllers;

use App\Models\EmployeeState;
use App\Models\User;
use App\Models\EmployeeDetails;
use App\Models\Schedules;
use App\Models\Company;
use App\Models\Branch;
use App\Models\Department;
use App\Models\Role;
use App\Models\Document;
use App\Models\WorkSession;
use App\Models\EarlyDepartureRequest;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Http\Response;


class EmployeeStateController extends Controller
{
    /**
        *Muestra una lista de los estados de empleados.
    */
    
    public function index()
    {
        // Obtener todos los estados de empleados
        $employeeStates = EmployeeState::all();
        if ($employeeStates->isEmpty()) {
            return response()->json([
                'status' => false,
                'message' => 'No se encontraron estados de empleados',
                'data' => []
            ], 404);
        }
        return response()->json([
            'status' => true,
            'message' => 'Lista de estados de empleados',
            'data' => $employeeStates
        ], 200);
    }

    /**
        *Guarda un nuevo estado de empleado.
     */
    public function store(Request $request)
    {
        
        // Validar la solicitud
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:255',
            'active' => 'required|boolean',
        ]);

        // Crear un nuevo estado de empleado
        $employeeState = EmployeeState::create($request->all());

        return response()->json([
            'status' => true,
            'message' => 'Estado de empleado creado con éxito',
            'data' => $employeeState
        ], 201);
    }


    /**
     * Muestra un estado de empleado por ID.
     */
    public function show($id)
    {
        try {
            $employeeState = EmployeeState::findOrFail($id);

            return response()->json([
                'status' => true,
                'message' => 'Estado de empleado encontrado',
                'data' => $employeeState
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Estado de empleado no encontrado',
            ], 404);
        }
    }



    /**
     * Actualizar un empleado
     */
    public function update(Request $request, $id)
    {
        // Validar la solicitud
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:255',
            'active' => 'required|boolean',
        ]);

        // Buscar el estado de empleado por ID
        try {
            $employeeState = EmployeeState::findOrFail($id);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Estado de empleado no encontrado',
            ], 404);
        }
        // Actualizar el estado de empleado 
        $employeeState->update($request->all());
        return response()->json([
            'status' => true,
            'message' => 'Estado de empleado actualizado con éxito',
            'data' => $employeeState
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        //
        // Buscar el estado de empleado por ID
        try {
            $employeeState = EmployeeState::findOrFail($id);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Estado de empleado no encontrado',
            ], 404);
        }
        // Verificar si el estado de empleado tiene usuarios asociados
        if ($employeeState->users()->exists()) {
            return response()->json([
                'status' => false,
                'message' => 'No se puede eliminar el estado de empleado porque tiene usuarios asociados',
            ], 400);
        }
        // Eliminar el estado de empleado
        $employeeState->delete();
        return response()->json([
            'status' => true,
            'message' => 'Estado de empleado eliminado con éxito',
        ], 200);
    }
}
