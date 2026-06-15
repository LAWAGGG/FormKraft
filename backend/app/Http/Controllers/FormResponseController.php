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
use Illuminate\Support\Facades\Storage;

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

        // We use request()->all() because files might be present
        $val = Validator::make($request->all(), [
            "answers" => "required|array",
            "answers.*.section_id" => "required|exists:form_sections,id",
            // Other fields are validated dynamically based on type
        ]);

        if ($val->fails()) {
            return $this->validateError($val);
        }

        $formResponse = FormResponse::create([
            "form_id" => $form->id,
            "user_id" => Auth::guard("sanctum")->id(),
            "total_score" => 0,
            "completed_at" => now(),
        ]);

        $totalQuizSections = $form->sections->where('is_quiz', true)->count();
        $scorePerQuestion = $totalQuizSections > 0 ? round(100 / $totalQuizSections, 2) : 0;
        $totalEarnedScore = 0;

        foreach ($request->answers as $index => $answer) {
            $section = $form->sections->find($answer["section_id"]);
            if (!$section) continue;

            $isCorrect = false;
            $earnedScore = 0;

            if ($section->type == "essay" || $section->type == "date" || $section->type == "rating") {
                $text = $answer["answer_text"] ?? null;
                if ($section->is_quiz && $section->type == "essay") {
                    $isCorrect = Str::contains(strtolower($text), strtolower($section->answer_key)) ?? false;
                } else {
                    $isCorrect = true; // Survey mode or non-gradable types
                }
                
                ResponseAnswer::create([
                    "response_id" => $formResponse->id,
                    "section_id" => $section->id,
                    "answer_text" => $text,
                    "is_correct" => $isCorrect,
                    "score" => ($section->is_quiz && $isCorrect) ? $scorePerQuestion : 0,
                ]);

                if ($section->is_quiz && $isCorrect) $totalEarnedScore += $scorePerQuestion;

            } elseif ($section->type == "option" || $section->type == "dropdown") {
                $optId = $answer["section_option_id"] ?? null;
                $option = $section->options->find($optId);
                $isCorrect = $option ? $option->is_correct : false;

                ResponseAnswer::create([
                    "response_id" => $formResponse->id,
                    "section_id" => $section->id,
                    "section_option_id" => $optId,
                    "is_correct" => $isCorrect,
                    "score" => ($section->is_quiz && $isCorrect) ? $scorePerQuestion : 0,
                ]);

                if ($section->is_quiz && $isCorrect) $totalEarnedScore += $scorePerQuestion;

            } elseif ($section->type == "checkbox") {
                $optIds = $answer["section_option_ids"] ?? [];
                if (is_string($optIds)) $optIds = json_decode($optIds, true) ?? [];
                
                $correctOptionIds = $section->options->where('is_correct', true)->pluck('id')->toArray();
                
                // Check if selected options match correct options exactly for quiz
                if ($section->is_quiz) {
                    $isCorrect = count($optIds) === count($correctOptionIds) && !array_diff($optIds, $correctOptionIds);
                } else {
                    $isCorrect = true;
                }

                foreach ($optIds as $oid) {
                    ResponseAnswer::create([
                        "response_id" => $formResponse->id,
                        "section_id" => $section->id,
                        "section_option_id" => $oid,
                        "is_correct" => $isCorrect, // We mark each row as correct if the whole set was correct
                        "score" => 0, // Individual score is 0, we'll add to total later
                    ]);
                }

                if ($section->is_quiz && $isCorrect) {
                    $totalEarnedScore += $scorePerQuestion;
                    // Update the rows to reflect the score (optional, but good for reporting)
                    ResponseAnswer::where('response_id', $formResponse->id)->where('section_id', $section->id)->update(['score' => $scorePerQuestion / max(1, count($optIds))]);
                }

            } elseif ($section->type == "file") {
                $filePath = null;
                if ($request->hasFile("answers.{$index}.answer_file")) {
                    $filePath = $request->file("answers.{$index}.answer_file")->store('responses', 'public');
                }

                ResponseAnswer::create([
                    "response_id" => $formResponse->id,
                    "section_id" => $section->id,
                    "answer_text" => $filePath,
                    "is_correct" => true,
                    "score" => 0,
                ]);
            }
        }

        $formResponse->update([
            "total_score" => min(100, round($totalEarnedScore))
        ]);

        return response()->json([
            "message" => "Form submitted successfully",
            "total_score" => $formResponse->total_score,
            "data" => FormResponse::with("answers")->find($formResponse->id)
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

        return response()->json([
            "form" => $result->form,
            "user" => $result->user,
            "total_score" => $result->total_score,
            "completed_at" => $result->completed_at,
            "answers" => $result->answers->groupBy('section_id')->map(function ($sectionAnswers) {
                $first = $sectionAnswers->first();
                $section = $first->section;
                
                return [
                    "section" => [
                        "id" => $section->id,
                        "title" => $section->title,
                        "type" => $section->type,
                        "description" => $section->description,
                        "image_url" => $section->image_url,
                        "is_quiz" => (bool) $section->is_quiz,
                        "options" => $section->options->map(fn($o) => [
                            "id" => $o->id,
                            "option_text" => $o->option_text,
                            "image_url" => $o->image_url,
                            "is_correct" => (bool) $o->is_correct
                        ])
                    ],
                    "is_correct" => (bool) $first->is_correct,
                    "score" => $sectionAnswers->sum('score'),
                    "answer_text" => $first->answer_text,
                    "options_selected" => $sectionAnswers->map(fn($a) => $a->option)->filter(),
                    "file_url" => ($section->type == 'file' && $first->answer_text) ? asset('storage/' . $first->answer_text) : null
                ];
            })->values()
        ]);
    }

    public function summary($slug)
    {
        $form = Form::with(["responses.user", "sections.options", "responses.answers.section"])->where("slug", $slug)->first();

        if (!$form) {
            return $this->notFound();
        }

        if ($form->user_id != Auth::guard("sanctum")->id()) {
            return $this->forbidden();
        }

        $totalRespondents = $form->responses()->count();
        $averageScore = round($form->responses()->average("total_score"), 1);
        $highestScore = $form->responses()->max("total_score") ?? 0;
        $lowestScore = $form->responses()->min("total_score") ?? 0;
        
        $chartResponses = $form->sections->filter(fn($s) => in_array($s->type, ['option', 'checkbox', 'dropdown', 'rating']))
            ->map(function ($section) use ($form) {
                $answers = ResponseAnswer::where('section_id', $section->id)->get();
                $totalAnswers = $answers->groupBy('response_id')->count(); // Count unique responses for this question
                
                if (in_array($section->type, ['option', 'checkbox', 'dropdown'])) {
                    $counts = $answers->whereNotNull('section_option_id')->countBy('section_option_id');
                    $options = $section->options->map(fn($o) => [
                        "id" => $o->id,
                        "option_text" => $o->option_text,
                        "count" => $counts[$o->id] ?? 0
                    ]);
                } else { // rating
                    $counts = $answers->countBy('answer_text');
                    $options = collect(range(1, 5))->map(fn($r) => [
                        "id" => $r,
                        "option_text" => "$r Stars",
                        "count" => $counts[$r] ?? 0
                    ]);
                }

                return [
                    "section_id" => $section->id,
                    "section_title" => $section->title,
                    "type" => $section->type,
                    "total_answers" => $totalAnswers,
                    "options" => $options
                ];
            })->values();

        return response()->json([
            "form" => $form,
            "summary" => [
                "total_respondents" => $totalRespondents,
                "average_score" => $averageScore,
                "highest_score" => $highestScore,
                "lowest_score" => $lowestScore,
            ],
            "charts" => $chartResponses,
            "responses" => $form->responses->map(fn($r) => [
                "id" => $r->id,
                "user" => $r->user,
                "total_score" => $r->total_score,
                "completed_at" => $r->completed_at,
            ])
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $response = FormResponse::with("form")->find($id);

        if (!$response) {
            return $this->notFound();
        }

        if ($response->form->user_id != Auth::guard("sanctum")->id()) {
            return $this->forbidden();
        }

        // Delete files associated with this response
        $fileAnswers = ResponseAnswer::where('response_id', $id)
            ->whereHas('section', fn($q) => $q->where('type', 'file'))
            ->get();
            
        foreach ($fileAnswers as $fa) {
            if ($fa->answer_text) Storage::disk('public')->delete($fa->answer_text);
        }

        $response->delete();

        return response()->json([
            "message" => "Response deleted successfully"
        ]);
    }
}
