<?php

namespace App\Http\Controllers;

use App\Models\SectionOption;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SectionOptionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $val = Validator::make($request->all(), [
            "option_text" => "required",
            "is_correct" => "required|boolean"
        ]);

        if ($val->fails()) {
            return $this->validateError($val);
        }

        $option = 

        return response()->json([]);
    }

    /**
     * Display the specified resource.
     */
    public function show(SectionOption $sectionOption)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(SectionOption $sectionOption)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, SectionOption $sectionOption)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SectionOption $sectionOption)
    {
        //
    }
}
