<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Form extends Model
{
    protected $guarded = [];

    public function sections(){
        return $this->hasMany(FormSection::class, "form_id")->orderBy("order", "asc");
    }

    public function user(){
        return $this->belongsTo(User::class, "user_id");
    }
}
