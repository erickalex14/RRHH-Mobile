<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;


class Company extends Model
{
    //
    use HasFactory;
    protected $table = 'companies';
    //LA PRIMARIA DE LA TABLA
    protected $primaryKey = 'company_id';
    //Datos que se ppueden llenar
    protected $fillable = [
        'name',
        'ruc',
        'address',
        'phone',
        'email',
        'created_by',
    ];

    //Relaciones
    //un tabla solo puede ser creada por un usuario
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    //una empresa puede tener muchas sucursales
    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class, 'company_id');
    }


}
