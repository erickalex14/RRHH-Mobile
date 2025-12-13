<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Http\Response;


class DocumentController extends Controller
{
    /**
     * Muestra una lista de los documentos.
     */
    public function index()
    {
        //
        $documents = Document::with('user')->get();
        return response()->json([
            'status' => true,
            'message' => $documents->isEmpty() ? 'No se encontraron documentos' : 'Lista de documentos',
            'data' => $documents
        ], 200);
    }


    /**
     * Guarda un nuevo documento (método para administradores).
     */
    public function store(Request $request)
    {
        // Check if this is a file upload from employee
        if ($request->hasFile('document')) {
            return $this->storeEmployeeDocument($request);
        }
        
        // Original admin method
        $request->validate([
            'user_id' => 'required|exists:users,user_id',
            'file_name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'doc_type' => 'required|string|max:50',
            'file_path' => 'required|string|max:255',
            'file_size' => 'required|integer|min:1',
            'uploaded_by' => 'required|exists:users,user_id',
        ]);
        try {
            $document = Document::create($request->all());

            return response()->json([
                'status' => true,
                'message' => 'Documento creado con éxito',
                'data' => $document
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error al crear el documento: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Guarda un nuevo documento subido por un empleado.
     */
    public function storeEmployeeDocument(Request $request)
    {
        $request->validate([
            'document' => 'required|file|mimes:pdf|max:5120', // 5MB max
            'document_type' => 'required|string|in:cv,certificate,id,other',
        ]);

        try {
            $file = $request->file('document');
            $user = $request->user();
            
            // Generate unique filename
            $fileName = $file->getClientOriginalName();
            $uniqueFileName = uniqid() . '_' . $fileName;
            
            // Store file in documents directory
            $filePath = $file->storeAs('documents', $uniqueFileName, 'local');
            
            // Create document record
            $document = Document::create([
                'user_id' => $user->user_id,
                'file_name' => $fileName,
                'doc_type' => $request->input('document_type'),
                'file_path' => $filePath,
                'file_size' => $file->getSize(),
                'uploaded_by' => $user->user_id,
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Documento subido con éxito',
                'data' => $document
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Error uploading employee document', [
                'user_id' => $request->user()->user_id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => false,
                'message' => 'Error al subir el documento: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Muestra el documento especificado por ID.
     */
    public function show($id)
    {
        //
        try {
            $document = Document::with('user')->findOrFail($id);
            return response()->json([
                'status' => true,
                'message' => 'Documento encontrado',
                'data' => $document
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Documento no encontrado',
            ], 404);
        }
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        //
        $request->validate([
            'user_id' => 'sometimes|exists:users,id',
            'file_name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:500',
            'doc_type' => 'sometimes|string|max:50',
            'file_path' => 'sometimes|string|max:255',
            'file_size' => 'sometimes|integer|min:1',
            'uploaded_by' => 'sometimes|exists:users,id',
        ]);
        try {
            $document = Document::findOrFail($id);
            $document->update($request->all());

            return response()->json([
                'status' => true,
                'message' => 'Documento actualizado con éxito',
                'data' => $document
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Documento no encontrado',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error al actualizar el documento: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Borrar el documento especificado por ID.
     */
    public function destroy($id)
    {
        //
        try {
            $document = Document::findOrFail($id);
            $document->delete();

            return response()->json([
                'status' => true,
                'message' => 'Documento eliminado con éxito',
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Documento no encontrado',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error al eliminar el documento: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Muestra los documentos de un usuario específico.
     */
    public function showByUser(Request $request)
    {
        $userId = $request->user()->user_id;
        
        $documents = Document::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => true,
            'message' => $documents->isEmpty() ? 'No se encontraron documentos para este usuario' : 'Documentos del usuario',
            'data' => $documents
        ], 200);
    }

    /**
     * Descarga un documento específico.
     */
    public function download($id)
    {
        try {
            $document = Document::findOrFail($id);
            
            // Try different storage paths
            $possiblePaths = [
                storage_path('app/' . $document->file_path),
                storage_path('app/public/' . $document->file_path),
                storage_path('app/private/' . $document->file_path),
                $document->file_path, // Direct path if absolute
            ];
            
            $filePath = null;
            foreach ($possiblePaths as $path) {
                if (file_exists($path)) {
                    $filePath = $path;
                    break;
                }
            }
            
            if (!$filePath) {
                \Log::error('Document file not found', [
                    'document_id' => $id,
                    'file_path' => $document->file_path,
                    'attempted_paths' => $possiblePaths
                ]);
                
                return response()->json([
                    'status' => false,
                    'message' => 'El archivo no se encuentra en el servidor',
                ], 404);
            }

            // Determine the MIME type
            $mimeType = mime_content_type($filePath) ?: 'application/octet-stream';
            
            // Return the file for download
            return response()->download($filePath, $document->file_name, [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'attachment; filename="' . $document->file_name . '"'
            ]);
            
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Documento no encontrado',
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error downloading document', [
                'document_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => false,
                'message' => 'Error al descargar el documento: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Subir documento para empleado autenticado.
     */
    public function uploadForEmployee(Request $request)
    {
        $request->validate([
            'document' => 'required|file|mimes:pdf|max:5120', // 5MB max
            'document_type' => 'required|string|in:cv,certificate,id,other',
        ]);

        try {
            $userId = $request->user()->user_id;
            $file = $request->file('document');
            
            // Generate unique filename
            $uniqueId = uniqid();
            $originalName = $file->getClientOriginalName();
            $fileName = $uniqueId . '_' . $originalName;
            
            // Store the file
            $filePath = $file->storeAs('documents', $fileName, 'local');
            
            // Create document record
            $document = Document::create([
                'user_id' => $userId,
                'file_name' => $originalName,
                'doc_type' => $request->document_type,
                'file_path' => $filePath,
                'file_size' => $file->getSize(),
                'uploaded_by' => $userId,
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Documento subido con éxito',
                'data' => $document
            ], 201);
            
        } catch (\Exception $e) {
            \Log::error('Error uploading document for employee', [
                'user_id' => $request->user()->user_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => false,
                'message' => 'Error al subir el documento: ' . $e->getMessage(),
            ], 500);
        }
    }
}
