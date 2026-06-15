<?php

namespace App\Http\Controllers;

use App\Models\Form;
use App\Models\FormSection;
use App\Models\SectionOption;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

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
            "type" => "required|string",
            "is_quiz" => "required|boolean",
            "answer_key" => "nullable",
            "description" => "nullable"
        ]);

        if ($val->fails()) {
            return $this->validateError($val);
        }

        $lastOrder = FormSection::where("form_id", $form->id)->orderBy("order", "desc")->first();

        $data = $request->all();
        $data["form_id"] = $form->id;
        $data["order"] = $lastOrder ? $lastOrder->order + 1 : 0;
        $section = FormSection::create($data);

        $optionTypes = ["option", "checkbox", "dropdown"];
        if (in_array($request->type, $optionTypes)) {
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

    public function uploadImage(Request $request, $id)
    {
        $section = FormSection::with("form")->find($id);

        if (!$section) {
            return $this->notFound();
        }

        if ($section->form->user_id != Auth::guard("sanctum")->user()->id) {
            return $this->forbidden();
        }

        $val = Validator::make($request->all(), [
            "image" => "required|image|mimes:jpeg,png,jpg,gif,svg|max:2048",
        ]);

        if ($val->fails()) {
            return $this->validateError($val);
        }

        if ($section->image_path) {
            Storage::disk('public')->delete($section->image_path);
        }

        $path = $request->file('image')->store('sections', 'public');
        $section->update(['image_path' => $path]);

        return response()->json([
            "message" => "Image uploaded succesfully",
            "image_url" => asset('storage/' . $path)
        ]);
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
            "description"=>$section->description,
            "image_path"=>$section->image_path,
            "type"=>$section->type,
            "order"=>$section->order,
            "answer_key"=>$section->answer_key,
            "is_quiz"=>$section->is_quiz
        ]);

        $optionTypes = ["option", "checkbox", "dropdown"];
        if(in_array($section->type, $optionTypes)){
            foreach($section->options as $opt){
                SectionOption::create([
                    "section_id"=>$cloneSect->id,
                    "option_text"=>$opt->option_text,
                    "image_path"=>$opt->image_path,
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
            "type" => "string",
            "description" => "nullable",
            "is_quiz" => "boolean",
            "answer_key" => "nullable"
        ]);

        if ($val->fails()) {
            return $this->validateError($val);
        }

        $data = $request->all();
        $oldType = $section->type;
        $newType = $request->type ?? $oldType;

        DB::transaction(function () use ($section, $oldType, $newType, $data) {
            $optionTypes = ["option", "checkbox", "dropdown"];
            
            if (in_array($oldType, $optionTypes) && !in_array($newType, $optionTypes)) {
                SectionOption::where("section_id", $section->id)->delete();
            }

            if (!in_array($oldType, $optionTypes) && in_array($newType, $optionTypes)) {
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

        if ($section->image_path) {
            Storage::disk('public')->delete($section->image_path);
        }

        $section->delete();

        return response()->json([
            "message" => "Form section deleted succesfully"
        ]);
    }
}
