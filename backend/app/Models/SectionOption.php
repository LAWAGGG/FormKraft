<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SectionOption extends Model
{
    protected $guarded = [];

    public function answers()
    {
        return $this->hasMany(ResponseAnswer::class, "section_id");
    }
}
