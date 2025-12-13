<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EarlyDepartureRequest extends Model
{
    //
    use HasFactory;
    protected $table = 'early_departure_requests';
    //LA PRIMARIA DE LA TABLA
    protected $primaryKey = 'request_id';
    //Datos que se ppueden llenar
    protected $fillable = [
        'user_id',
        'work_date',
        'description',
        'request_date',
        'request_time',
        'document_path',
        'status',
        'approved_by',
        'created_by',
    ];

    //Relaciones

    //una solicitud de salida temprana pertenece a un solo usuario
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    //una solicitud de salida temprana puede ser aprobada por un solo usuario
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    //una solicitud de salida temprana puede ser creada por un solo usuario
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
