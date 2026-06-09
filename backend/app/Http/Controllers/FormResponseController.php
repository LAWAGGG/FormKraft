<?php

namespace App\Http\Controllers;

use App\Models\Form;
use App\Models\FormResponse;
use App\Models\FormSection;
use App\Models\ResponseAnswer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class FormResponseController extends Controller
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
    public function store(Request $request, $slug)
    {
        $form = Form::with("sections.options")->where("slug", $slug)->first();

        if (!$form) {
            return $this->notFound();
        }

        $val = Validator::make($request->all(), [
            "answers" => "required|array",
            "answers.*.section_id" => "required|exists:form_sections,id",
            "answers.*.section_option_id" => "exists:section_options,id",
            "answers.*.answer_text" => "string",
        ]);

        if ($val->fails()) {
            return $this->validateError($val);
        }

        $formResponse = FormResponse::create([
            "form_id" => $form->id,
            "user_id" => Auth::guard("sanctum")->user()->id,
            "total_score" => 0,
            "completed_at" => now(),
        ]);

        $totalQuestion = 0;

        foreach ($request->answers as $answer) {
            $section = FormSection::find($answer["section_id"]);

            if (!$section) {
                return $this->notFound();
            }

            if ($section->is_quiz == true) {
                $totalQuestion++;
            }
        }

        if ($totalQuestion > 0) {
            $scorePerQuestion = round(100 / $totalQuestion, 2);
        } else {
            $scorePerQuestion = 0;
        }

        $correctAnswers = 0;
        foreach ($request->answers as $answer) {
            $section = FormSection::with("options")->find($answer["section_id"]);

            if (!$section) {
                return $this->notFound();
            }

            if ($section->is_quiz == true) {
                if ($section->type == "option") {
                    $optionSelected = $section->options->find($answer["section_option_id"]);
                    if ($optionSelected->is_correct == true) {
                        $correctAnswers++;
                    }

                    ResponseAnswer::create([
                        "response_id" => $formResponse->id,
                        "section_id" => $section->id,
                        "section_option_id" => $optionSelected->id,
                        "answer_text" => null,
                        "is_correct" => $optionSelected->is_correct,
                        "score" => $optionSelected->is_correct ? $scorePerQuestion : 0,
                    ]);
                } else {
                    $isCorrect = Str::contains(strtolower($answer["answer_text"]), strtolower($section->answer_key)) ?? false;

                    if ($isCorrect) {
                        $correctAnswers++;
                    }

                    ResponseAnswer::create([
                        "response_id" => $formResponse->id,
                        "section_id" => $section->id,
                        "section_option_id" => null,
                        "answer_text" => $answer["answer_text"] ?? null,
                        "is_correct" => $isCorrect ? true : false,
                        "score" => $isCorrect ? $scorePerQuestion : 0,
                    ]);
                }
            } else {
                if ($section->type == "option") {
                    $optionSelected = $section->options->find($answer["section_option_id"]);

                    ResponseAnswer::create([
                        "response_id" => $formResponse->id,
                        "section_id" => $section->id,
                        "section_option_id" => $optionSelected->id,
                        "answer_text" => null,
                        "is_correct" => $optionSelected->is_correct ?? true,
                        "score" => 0,
                    ]);
                } else {
                    ResponseAnswer::create([
                        "response_id" => $formResponse->id,
                        "section_id" => $section->id,
                        "section_option_id" => null,
                        "answer_text" => $answer["answer_text"] ?? null,
                        "is_correct" => true,
                        "score" => 0,
                    ]);
                }
            }
        }

        if ($totalQuestion > 0) {
            $finalScore = round(($correctAnswers / $totalQuestion) * 100);
        } else {
            $finalScore = 0;
        }

        $formResponse->update([
            "total_score" => $finalScore
        ]);

        $result = FormResponse::with("answers")->find($formResponse->id);

        return response()->json([
            "message" => "question submitted sucesfully",
            "total_score" => $finalScore,
            "data" => $result
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show($slug, $responseId)
    {
        $form = Form::with("sections.options")->where("slug", $slug)->first();

        if (!$form) {
            return $this->notFound();
        }

        $result = FormResponse::with(["answers.section.options", "answers.option", "form", "user"])->where("form_id", $form->id)->find($responseId);

        if (!$result) {
            return $this->notFound();
        }

        $isQuiz = $result->answers->contains(function ($answ) {
            return $answ->section && $answ->section->is_quiz == 1;
        });

        $totalCorrect = 0;
        $totalIncorrect = 0;

        if ($isQuiz) {
            $totalCorrect = $result->answers->filter(function ($answ) {
                return $answ->section && $answ->section->is_quiz == 1 && $answ->is_correct == 1;
            })->count();

            $totalIncorrect = $result->answers->filter(function ($answ) {
                return $answ->section && $answ->section->is_quiz == 1 && $answ->is_correct == 0;
            })->count();
        }

        return response()->json([
            "form" => $result->form,
            "user" => $result->user,
            "form_type" => $isQuiz ? "quiz" : "survey",
            "total_score" => $result->total_score,
            "completed_at" => $result->completed_at,
            "total_correct" => $totalCorrect,
            "total_incorrect" => $totalIncorrect,
            "answers" => $result->answers->map(function ($answer) {
                return [
                    "id" => $answer->id,
                    "is_correct" => $answer->is_correct ? true : false,
                    "score" => $answer->score,
                    "type" => $answer->section->type,
                    "option" => $answer->option,
                    ...($answer->section->type == "essay" ? [
                        "answer_text" => $answer->answer_text
                    ] : []),
                    "section" => [
                        "id" => $answer->section->id,
                        "title" => $answer->section->title,
                        "type" => $answer->section->type,
                        "order" => $answer->section->order,
                        "is_quiz" => $answer->section->is_quiz ? true : false,
                        ...($answer->section->type == "option" ? [
                            "options" => $answer->section->options->map(function ($opt) {
                                return [
                                    "id" => $opt->id,
                                    "option_text" => $opt->option_text,
                                    "is_correct" => $opt->is_correct ? true : false,
                                ];
                            })
                        ] : []),
                        ...($answer->section->type == "essay" && $answer->section->is_quiz == 1 ? [
                            "answer_key" => $answer->section->answer_key
                        ] : [])
                    ],

                ];
            })

            // ...($isQuiz ? [

            // ] : [
            //     "form_type" => "survey",
            //     "completed_at" => $result->completed_at,
            //     "form" => $result->form,
            //     "message" => "Thankyou for contributing to this {$result->form->title} form!"
            // ]),
        ]);
    }

    public function summary($slug)
    {
        $form = Form::with("responses.user")->where("slug", $slug)->first();

        if (!$form) {
            return $this->notFound();
        }

        if ($form->user_id != Auth::guard("sanctum")->user()->id) {
            return $this->forbidden();
        }

        $totalRespondents = $form->responses()->count();
        $averageScore = round($form->responses()->average("total_score"), 1);
        $highestScore = $form->responses()->max("total_score");
        $lowestScore = $form->responses()->min("total_score");

        return response()->json([
            "form" => [
                "id" => $form->id,
                "title" => $form->title,
                "slug" => $form->slug,
                "description" => $form->description,
            ],
            "summary" => [
                "total_respondents" => $totalRespondents,
                "average_scores" => $averageScore,
                "highest_score" => $highestScore,
                "lowest_score" => $lowestScore,
            ],
            "responses" => $form->responses->map(function ($res) {
                return [
                    "id" => $res->id,
                    "user" => $res->user,
                    "total_score" => $res->total_score,
                    "completed_at" => $res->completed_at,
                ];
            })
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(FormResponse $formResponse)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, FormResponse $formResponse)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $response = FormResponse::with("form")->find($id);

        if(!$response){
            return $this->notFound();
        }

        if($response->form->user_id != Auth::guard("sanctum")->user()->id){
            return $this->forbidden();
        }

        $response->delete();

        return response()->json([
            "message"=>"Response deleted succesfully"
        ]);
    }
}
