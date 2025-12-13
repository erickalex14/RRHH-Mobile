<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Company;
use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use App\Models\Document;
use App\Models\WorkSession;
use App\Models\EarlyDepartureRequest;
use App\Models\EmployeeState;
use App\Models\EmployeeDetails;
use App\Models\schedules;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

use Illuminate\database\Eloquent\ModelNotFoundException;

class BranchController extends Controller
{
    /**
     * muestra una lista de las sucursales.
     */
    public function index()
    {
        $branches = Branch::with('company','user')->get();

        return response()->json([
            'status' => true,
            'message' => 'Lista de sucursales',
            'data' => $branches
        ], 200);
    }


    /**
     * Guarda una nueva sucursal.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'company_id' => 'required|exists:companies,company_id',
            'code' => 'required|string|max:50|unique:branches,code',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'country' => 'required|string|max:100',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:15',
            'matrix' => 'required|boolean',
            'created_by' => 'nullable|exists:users,user_id',
            // Agrega otras validaciones según sea necesario
        ]);

        $branch = Branch::create($request->all());

        return response()->json([
            'status' => true,
            'message' => 'Sucursal creada con éxito',
            'data' => $branch
        ], 201);
    }

    /**
     * Muestra la sucursal por id.
     */
    public function show($id)
    {
        try {
            $branch = Branch::with('company','user')->findOrFail($id);
            return response()->json([
                'status' => true,
                'message' => 'Sucursal encontrada',
                'data' => $branch
            ], 201);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Sucursal no encontrada',
            ], 404);
        }
    }


    /**
     * Actualiza la sucursal por id.
     */

    public function update(Request $request, $id)
    {
        try {
            $branch = Branch::findOrFail($id);
            $branch->update($request->all());

            return response()->json([
                'status' => true,
                'message' => 'Sucursal actualizada con éxito',
                'data' => $branch
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Sucursal no encontrada',
            ], 404);
        }
    }

    /**
     * Elimina la sucursal por id.
     */
    public function destroy($id)
    {
        try {
            $branch = Branch::findOrFail($id);
            $branch->delete();

            return response()->json([
                'status' => true,
                'message' => 'Sucursal eliminada con éxito',
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Sucursal no encontrada',
            ], 404);
        }
    }
}
