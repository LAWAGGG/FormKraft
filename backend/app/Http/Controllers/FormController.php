<?php

namespace App\Http\Controllers;

use App\Models\Form;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class FormController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $forms = Form::with("sections")->where("user_id", Auth::guard("sanctum")->user()->id)->get();

        return response()->json([
            "forms" => $forms->map(function ($form) {
                return [
                    "id" => $form->id,
                    "slug" => $form->slug,
                    "title" => $form->title,
                    "description" => $form->description,
                    "total_questions" => $form->sections()->count(),
                ];
            })
        ]);
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
            "title" => "required",
            "description" => "required"
        ]);

        if ($val->fails()) {
            return $this->validateError($val);
        }

        $data = $request->all();
        $data["user_id"] = Auth::guard("sanctum")->user()->id;
        $slug = Str::slug($request->title);
        $isNotUnique = Form::where("slug", $slug)->exists();

        if ($isNotUnique) {
            return response()->json([
                "message" => "Invalid fields",
                "errors" => [
                    "slug" => [
                        "The slug field is not unique."
                    ]
                ]
            ], 422);
        }

        $data["slug"] = $slug;

        $form = Form::create($data);

        return response()->json([
            "message" => "Form created succesfully",
            "data" => $form
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($slug)
    {
        $form = Form::with("sections.options")->where("slug", $slug)->first();

        if (!$form) {
            return $this->notFound();
        }

        $user = Auth::guard("sanctum")->id();

        return response()->json([
            "id" => $form->id,
            "title" => $form->title,
            "slug" => $form->slug,
            "description" => $form->description,
            "sections" => $form->sections->map(function ($sect) use ($form, $user) {
                // dd($sect->is_quiz, $sect->type == "essay", $form->user_id == Auth::guard("sanctum")->user()->id);
                return [
                    "id" => $sect->id,
                    "title" => $sect->title,
                    "type" => $sect->type,
                    ...($sect->type == "essay" && $sect->is_quiz && $form->user_id == $user  ? [
                        "answer_key"=>$sect->answer_key
                    ] : []),
                    "order" => $sect->order,
                    "is_quiz" => $sect->is_quiz ? true : false,
                    ...($sect->type == "option" ? [
                        "options" => $sect->options->map(function ($opt) use($form, $user) {
                            return [
                                "id" => $opt->id,
                                "option_text" => $opt->option_text,
                                ...($form->user_id == $user ? [
                                    "is_correct" => $opt->is_correct ? true : false,
                                ] : [])
                            ];
                        })
                    ] : [])
                ];
            })
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Form $form)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $slug)
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
            "description" => "required"
        ]);

        if ($val->fails()) {
            return $this->validateError($val);
        }

        $form->update($request->all());

        return response()->json([
            "message" => "Form updated succesfully",
            "data" => $form
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($slug)
    {
        $form = Form::where("slug", $slug)->first();

        if (!$form) {
            return $this->notFound();
        }

        if ($form->user_id != Auth::guard("sanctum")->user()->id) {
            return $this->forbidden();
        }

        $form->delete();

        return response()->json([
            "message" => "Form deleted succesfully",
        ]);
    }
}
