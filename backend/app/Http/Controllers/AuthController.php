<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function register(Request $request){
        $val = Validator::make($request->all(), [
            "email"=>"required|email|unique:users,email",
            "name"=>"required",
            "password"=>"required|min:6",
        ]);

        if($val->fails()){
            return $this->validateError($val);
        }

        $user = User::create($request->all());

        Auth::login($user);

        $token = $user->createToken("key")->plainTextToken;

        return response()->json([
            "message"=>"Register successful",
            "token"=>$token,
            "user"=>$user,
        ],201);
    }

    public function login(Request $request){
        $val = Validator::make($request->all(), [
            "email"=>"required",
            "password"=>"required|min:6",
        ]);

        if($val->fails()){
            return $this->validateError($val);
        }

       if(!Auth::attempt($request->only("email", "password"))){
        return response()->json([
            "message"=>"Invalid username or password",
        ],401);
       }

       $user = Auth::guard("sanctum")->user();

        $token = $user->createToken("key")->plainTextToken;

        return response()->json([
            "message"=>"Login successful",
            "token"=>$token,
            "user"=>$user,
        ]);
    }

    public function logout(){
        Auth::guard("sanctum")->user()->currentAccessToken()->delete();

        return response()->json([
            "message"=>"logout success"
        ]);
    }
}
