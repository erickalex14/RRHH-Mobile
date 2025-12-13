<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Schedule extends Model
{
    //
    use HasFactory;
    protected $table = 'schedules';
    //LA PRIMARIA DE LA TABLA
    protected $primaryKey = 'schedule_id';
    //Datos que se ppueden llenar
    protected $fillable = [
        'name',
        'start_time',
        'end_time',
        'lunch_start',
        'lunch_end',
        'active',
        'created_by',
    ];

    //Relaciones
    //un horario solo puede ser creado por un usuario
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    //un horario puede tener muchos usuarios mediante la tabla employee_details
    public function employees(): HasMany
    {
        return $this->hasMany(EmployeeDetail::class, 'schedule_id');
    }
}
