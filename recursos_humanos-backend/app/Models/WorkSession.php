<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkSession extends Model
{
    //
    use HasFactory;
    protected $table = 'work_sessions';
    //LA PRIMARIA DE LA TABLA
    protected $primaryKey = 'session_id';
    //Datos que se ppueden llenar
    protected $fillable = [
        'user_id',
        'work_date',
        'start_time',   
        'end_time',
        'lunch_start',
        'lunch_end',
        'latitude',
        'longitude',
        'created_by',
    ];

    //Relaciones
    //una sesion de trabajo solo puede tener un usuario
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    //un tabla solo puede ser creada por un usuario
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
