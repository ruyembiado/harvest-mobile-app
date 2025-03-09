<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $table = 'tasks';
    protected $fillable = ['rice_land_id', 'task', 'date'];

    public function riceLand()
    {
        return $this->belongsTo(RiceLand::class);
    }
}
