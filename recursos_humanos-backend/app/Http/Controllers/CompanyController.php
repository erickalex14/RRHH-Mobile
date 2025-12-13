<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Http\Response;


class CompanyController extends Controller
{
    /**
    *Muestra las compañias
    */
    public function index()
    {
        $companies = Company::with('user')->get();
        return response()->json([
            'status' => true,
            'message' => 'Lista de compañias',
            'data' => $companies
        ], 200);
    }


    /**
     *Almacena una nueva compañia
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'ruc' => 'required|string|max:13|unique:companies,ruc',
            'address' => 'required|string|max:255',
            'phone' => 'required|string|max:15',
            'email' => 'required|email|max:255',
            'created_by' => 'nullable|exists:users,user_id',
        ]);

        $company = Company::create($request->all());

        return response()->json([
            'status' => true,
            'message' => 'Compañia creada con éxito',
            'data' => $company
        ], 201);
    }

    /**
     * Muestra la compañia por id
     */
    public function show( $id)
    {
        try {
            $company = Company::with('user')->findOrFail($id);
            return response()->json([
                'status' => true,
                'message' => 'Compañia encontrada',
                'data' => $company
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Compañia no encontrada',
            ], 404);
        }
    }



    /**
     * Actualiza la compañia por id
     */
    public function update(Request $request, $id)
    {
        try {
            $company = Company::findOrFail($id);
            $company->update($request->all());

            return response()->json([
                'status' => true,
                'message' => 'Compañia actualizada con éxito',
                'data' => $company
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Compañia no encontrada',
            ], 404);
        }
    }

    /**
     * borra la compañia por id
     */
    public function destroy(Company $company)
    {
        try {
            $company->delete();
            return response()->json([
                'status' => true,
                'message' => 'Compañia eliminada con éxito',
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Compañia no encontrada',
            ], 404);
        }
    }
}
