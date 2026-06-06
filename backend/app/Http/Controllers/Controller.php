<?php

namespace App\Http\Controllers;

abstract class Controller
{
    public function validateError($val){
        return response()->json([
            "status"=>"error",
            "message"=>"Invalid fields",
            "errors"=>$val->errors()
        ],422);
    }

    public function notFound(){
        return response()->json([
            "status"=>"error",
            "message"=>"Not found"
        ],404);
    }

    public function forbidden(){
        return response()->json([
            "status"=>"error",
            "message"=>"Forbidden Access"
        ],403);
    }

}
