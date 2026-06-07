<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResponseAnswer extends Model
{
    protected $guarded = [];

    public function response(){
        return $this->belongsTo(FormResponse::class, "response_id");
    }

    public function section(){
        return $this->belongsTo(FormSection::class, "section_id");
    }

    public function option(){
        return $this->belongsTo(SectionOption::class, "section_option_id");
    }
}
