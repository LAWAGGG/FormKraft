<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FormSection extends Model
{
    protected $guarded = [];

    protected $appends = ['image_url'];

    public function getImageUrlAttribute()
    {
        return $this->image_path ? asset('storage/' . $this->image_path) : null;
    }

    public function form(){
        return $this->belongsTo(Form::class, "form_id");
    }

    public function options(){
        return $this->hasMany(SectionOption::class, "section_id");
    }

    public function answers(){
        return $this->hasMany(ResponseAnswer::class, "section_id");
    }
}
