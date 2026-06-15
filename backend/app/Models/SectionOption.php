<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SectionOption extends Model
{
    protected $guarded = [];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute()
    {
        return $this->image_path ? asset('storage/' . $this->image_path) : null;
    }

    public function answers()
    {
        return $this->hasMany(ResponseAnswer::class, "section_option_id");
    }
}
