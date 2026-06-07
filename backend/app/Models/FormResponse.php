<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FormResponse extends Model
{
    protected $guarded = [];

    public function answers(){
        return $this->hasMany(ResponseAnswer::class, "response_id");
    }

    public function form(){
        return $this->belongsTo(Form::class, "form_id");
    }

    public function user(){
        return $this->belongsTo(User::class, "user_id");
    }
}
