<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;


class Document extends Model
{
    //
    use HasFactory;
    protected $table = 'documents';
    //LA PRIMARIA DE LA TABLA
    protected $primaryKey = 'document_id';
    //Datos que se ppueden llenar
    protected $fillable = [
        'user_id',
        'file_name',
        'description',
        'doc_type',
        'file_path',
        'file_size',
        'uploaded_by',
    ];

    //Relaciones
    //Un documento pertenece a un solo usuario
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    //un documento solo puede ser subido por un usuario
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by', 'user_id');
    }
}
