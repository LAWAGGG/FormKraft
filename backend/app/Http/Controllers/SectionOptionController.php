<?php

namespace App\Http\Controllers;

use App\Models\FormSection;
use App\Models\SectionOption;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

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

        $optionCount = SectionOption::where("section_id", $section->id)->count();
        if ($optionCount >= 10) { // Increased limit for flexibility
            return response()->json([
                "message" => "you cannot add options more than 10!"
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

    public function uploadImage(Request $request, $id)
    {
        $option = SectionOption::find($id);

        if (!$option) {
            return $this->notFound();
        }

        $section = FormSection::with("form")->find($option->section_id);
        if ($section->form->user_id != Auth::guard("sanctum")->user()->id) {
            return $this->forbidden();
        }

        $val = Validator::make($request->all(), [
            "image" => "required|image|mimes:jpeg,png,jpg,gif,svg|max:2048",
        ]);

        if ($val->fails()) {
            return $this->validateError($val);
        }

        if ($option->image_path) {
            Storage::disk('public')->delete($option->image_path);
        }

        $path = $request->file('image')->store('options', 'public');
        $option->update(['image_path' => $path]);

        return response()->json([
            "message" => "Option image uploaded succesfully",
            "image_url" => asset('storage/' . $path)
        ]);
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
            "options.*.option_text" => "nullable",
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

        // Only enforce single correct answer for 'option' (radio) and 'dropdown'
        if (($section->type == "option" || $section->type == "dropdown") && $correctCount > 1 && $section->is_quiz) {
            return response()->json([
                "message" => "This question type must have exactly one correct answer"
            ], 403);
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
                "options" => $section->options->map(function ($opt) {
                    return [
                        "id" => $opt->id,
                        "option_text" => $opt->option_text,
                        "image_url" => $opt->image_url,
                        "is_correct" => $opt->is_correct,
                    ];
                })
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

        if ($opt->image_path) {
            Storage::disk('public')->delete($opt->image_path);
        }

        $totalOpt = SectionOption::where("section_id", $section->id)->count();

        if($totalOpt < 2){
            return response()->json([
                "message"=>"the options cannot less than 2"
            ],403); // Fixed 201 to 403
        }

        $opt->delete();

        return response()->json([
            "message" => "Option deleted succesfully",
        ]);
    }
}
