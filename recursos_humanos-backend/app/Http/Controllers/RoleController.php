<?php

namespace App\Http\Controllers;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class RoleController extends Controller
{
    /**
     * Muestra una lista de Roles:
     */
    public function index()
    {
        $roles = Role::with('user')->get();
        return response()->json([
            'status' => true,
            'message' => 'Lista de roles',
            'data' => $roles
        ], 201);

    }


    /**
     * Guarda un nuevo rol.
     */
    public function store(Request $request)
    {
        //
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string|max:500',
                'salary' => 'required|string|max:100',
                'admin' => 'required|boolean',
                'created_by' => 'nullable|exists:users,user_id',

            ]);

            $role = Role::create($request->all());

            return response()->json([
                'status' => true,
                'message' => 'Rol creado con éxito',
                'data' => $role
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error al crear el rol: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Muestra el rol por id.
     */
    public function show($id)
    {
        //
        try {
            $role = Role::with('user')->findOrFail($id);
            return response()->json([
                'status' => true,
                'message' => 'Rol encontrado',
                'data' => $role
            ], 201);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Rol no encontrado',
            ], 404);
        }
    }


    /**
     * Actualiza el rol por id.
     */
    public function update(Request $request, $id)
    {
        //
        try {
            $role = Role::findOrFail($id);
            $role->update($request->all());

            return response()->json([
                'status' => true,
                'message' => 'Rol actualizado con éxito',
                'data' => $role
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Rol no encontrado',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error al actualizar el rol: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Elimina el rol por id.
     */
    public function destroy(Role $role)
    {
        //
        try {
            $role->delete();
            return response()->json([
                'status' => true,
                'message' => 'Rol eliminado con éxito',
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Rol no encontrado',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error al eliminar el rol: ' . $e->getMessage(),
            ], 500);
        }
    }
}
