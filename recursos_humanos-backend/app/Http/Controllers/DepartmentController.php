<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Branch;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

use Illuminate\Database\Eloquent\ModelNotFoundException;

class DepartmentController extends Controller
{
    /**
     * Muestra una lista de los departamentos.
     */
    public function index()
    {
        $departments = Department::with('branch.company','user')->get();

        return response()->json([
            'status' => true,
            'message' => 'Lista de departamentos',
            'data' => $departments
        ], 200);
    }


    /**
     * Guarda un nuevo departamento.
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'branch_id' => 'required|exists:branches,branch_id',
                'created_by' => 'nullable|exists:users,user_id',
            ]);

            $department = Department::create($request->all());

            return response()->json([
                'status' => true,
                'message' => 'Departamento creado con éxito',
                'data' => $department
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error al crear el departamento: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Muestra el departamento por id.
     */
    public function show($id)
    {
        try {
            $department = Department::with('branch.company','user')->findOrFail($id);
            return response()->json([
                'status' => true,
                'message' => 'Departamento encontrado',
                'data' => $department
            ], 201);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Departamento no encontrado',
            ], 404);
        }
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        try {
            $department = Department::findOrFail($id);
            $department->update($request->all());
            return response()->json([
                'status' => true,
                'message' => 'Departamento actualizado con éxito',
                'data' => $department
            ], 201);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Departamento no encontrado',
            ], 404);
        }
    }

    /**
     * Elimina el departamento por id.
     */
    public function destroy($id)
    {
        try {
            $department = Department::findOrFail($id);
            $department->delete();
            return response()->json([
                'status' => true,
                'message' => 'Departamento eliminado con éxito',
            ], 201);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Departamento no encontrado',
            ], 404);
        }
    }
}
