<?php

namespace App\Http\Controllers;

use App\Models\Form;
use App\Models\FormSection;
use App\Models\SectionOption;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class FormSectionController extends Controller
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

    function reorder(Request $request, $slug)
    {
        $form = Form::with("sections.options")->where("slug", $slug)->first();

        if (!$form) {
            return $this->notFound();
        }

        if ($form->user_id != Auth::guard("sanctum")->user()->id) {
            return $this->forbidden();
        }

        $val = Validator::make($request->all(), [
            "sections" => "required|array",
            "sections.*" => "required|exists:form_sections,id"
        ]);

        if ($val->fails()) {
            return $this->validateError($val);
        }

        $pos = 0;
        foreach ($request->sections as $sect) {
            $section = FormSection::where("form_id", $form->id)->find($sect);
            if (!$section) {
                return $this->notFound();
            }

            $pos++;
            $section->update([
                "order" => $pos
            ]);
        }

        return response()->json([
            "message" => "Sections reordered succesfully"
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, $slug)
    {
        $form = Form::where("slug", $slug)->first();

        if (!$form) {
            return $this->notFound();
        }

        if ($form->user_id != Auth::guard("sanctum")->user()->id) {
            return $this->forbidden();
        }

        $val = Validator::make($request->all(), [
            "title" => "required",
            "type" => "required|in:essay,option",
            "is_quiz" => "required|boolean",
            "answer_key" => "nullable"
        ]);

        if ($val->fails()) {
            return $this->validateError($val);
        }

        $lastOrder = FormSection::where("form_id", $form->id)->orderBy("order", "desc")->first();

        $data = $request->all();
        $data["form_id"] = $form->id;
        $data["order"] = $lastOrder ? $lastOrder->order + 1 : 0;
        $section = FormSection::create($data);

        if ($request->type == "option") {
            for ($i = 0; $i < 4; $i++) {
                SectionOption::create([
                    "section_id" => $section->id,
                    "option_text" => null,
                    "is_correct" => false
                ]);
            }
        }

        return response()->json([
            "message" => "Section created succesfully",
            "data" => $section
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(FormSection $formSection)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(FormSection $formSection)
    {
        //
    }

    public function duplicate($id)
    {
        $section = FormSection::with("form", "options")->find($id);

        if (!$section) {
            return $this->notFound();
        }

        if($section->form->user_id != Auth::guard("sanctum")->user()->id){
            return $this->forbidden();
        }

        $cloneSect = FormSection::create([
            "form_id"=>$section->form->id,
            "title"=>$section->title,
            "type"=>$section->type,
            "order"=>$section->order,
            "answer_key"=>$section->answer_key,
            "is_quiz"=>$section->is_quiz
        ]);

        if($section->type == "option"){
            foreach($section->options as $opt){
                SectionOption::create([
                    "section_id"=>$cloneSect->id,
                    "option_text"=>$opt->option_text,
                    "is_correct"=>$opt->is_correct,
                ]);
            }
        }

        return response()->json([
            "message"=>"Sections Duplicate succesfully"
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $slug, $id)
    {
        $form = Form::where("slug", $slug)->first();

        if (!$form) {
            return $this->notFound();
        }

        if ($form->user_id != Auth::guard("sanctum")->user()->id) {
            return $this->forbidden();
        }

        $section = FormSection::where("form_id", $form->id)->find($id);

        if (!$section) {
            return $this->notFound();
        }

        $val = Validator::make($request->all(), [
            "title" => "string",
            "type" => "in:essay,option",
            "is_quiz" => "boolean",
            "answer_key" => "nullable"
        ]);

        if ($val->fails()) {
            return $this->validateError($val);
        }

        $data = $request->all();
        DB::transaction(function () use ($section, $request, $data) {
            if ($section->type == "option" && $request->type == "essay") {
                SectionOption::where("section_id", $section->id)->delete();
            }

            if ($section->type == "essay" && $request->type == "option") {
                $data["answer_key"] = null;

                for ($i = 0; $i < 4; $i++) {
                    SectionOption::create([
                        "section_id" => $section->id,
                        "option_text" => null,
                        "is_correct" => false
                    ]);
                }
            }

            $section->update($data);
        });

        return response()->json([
            "message" => "Section updated succesfully",
            "data" => $section
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($slug, $id)
    {
        $form = Form::where("slug", $slug)->first();

        if (!$form) {
            return $this->notFound();
        }

        if ($form->user_id != Auth::guard("sanctum")->user()->id) {
            return $this->forbidden();
        }

        $section = FormSection::where("form_id", $form->id)->find($id);

        if (!$section) {
            return $this->notFound();
        }

        $section->delete();

        return response()->json([
            "message" => "Form section deleted succesfully"
        ]);
    }
}
