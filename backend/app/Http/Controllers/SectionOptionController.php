<?php

namespace App\Http\Controllers;

use App\Models\FormSection;
use App\Models\SectionOption;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
    public function store(Request $request, $id)
    {
        $section = FormSection::with("form")->find($id);

        if (!$section) {
            return $this->notFound();
        }

        if ($section->form->user_id != Auth::guard("sanctum")->user()->id) {
            return $this->forbidden();
        }

        $questionCount = SectionOption::where("section_id", $section->id)->count();
        if ($questionCount >= 4) {
            return response()->json([
                "message" => "you cannot add options more than 4!"
            ], 403);
        }

        $option = SectionOption::create([
            "section_id" => $section->id,
            "option_text" => null,
            "is_correct" => false
        ]);

        return response()->json([
            "message" => "Option created succesfully",
            "data" => $option
        ], 201);
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
    public function update(Request $request, $id)
    {
        $section = FormSection::with("form")->find($id);

        if (!$section) {
            return $this->notFound();
        }

        if ($section->form->user_id != Auth::guard("sanctum")->user()->id) {
            return $this->forbidden();
        }

        $val = Validator::make($request->all(), [
            "options" => "required|array",
            "options.*.id" => "required|exists:section_options,id",
            "options.*.option_text" => "required|string",
            "options.*.is_correct" => "required|boolean",
        ]);

        if ($val->fails()) {
            return $this->validateError($val);
        }

        $correctCount = 0;

        foreach ($request->options as $opt) {
            if($opt["is_correct"] == true){
                $correctCount++;
            }
        }

        if(($correctCount > 1 || $correctCount <= 0) && $section->is_quiz){
            return response()->json([
                "message"=>"Each question must have exactly one correct answer"
            ],403);
        }

        foreach ($request->options as $opt) {
            $option = SectionOption::where("section_id", $section->id)->find($opt["id"]);
            if (!$option) {
                return $this->notFound();
            }

            $option->update([
                "option_text" => $opt["option_text"],
                "is_correct" => $opt["is_correct"],
            ]);
        }

        return response()->json([
            "message" => "options updated succesfully",
            "data" => [
                "id" => $section->id,
                "title" => $section->title,
                "type" => $section->type,
                "order" => $section->order,
                "is_quiz" => $section->is_quiz,
                ...($section->type == "option" ? [
                    "options" => $section->options->map(function ($opt) {
                        return [
                            "id" => $opt->id,
                            "option_text" => $opt->option_text,
                            "is_correct" => $opt->is_correct,
                        ];
                    })
                ] : [])
            ]
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id, $optId)
    {
        $section = FormSection::with("form")->find($id);

        if (!$section) {
            return $this->notFound();
        }

        if ($section->form->user_id != Auth::guard("sanctum")->user()->id) {
            return $this->forbidden();
        }

        $opt = SectionOption::where("section_id", $section->id)->find($optId);

        if (!$opt) {
            return $this->notFound();
        }

        $totalOpt = SectionOption::where("section_id", $section->id)->count();

        if($totalOpt < 2){
            return response()->json([
                "message"=>"the options cannot less than 2"
            ],201);
        }

        $opt->delete();

        return response()->json([
            "message" => "Option deleted succesfully",
        ]);
    }
}
