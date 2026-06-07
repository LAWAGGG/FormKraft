<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('response_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId("response_id")->nullable()->constrained("form_responses")->onDelete("cascade");
            $table->foreignId("section_id")->constrained("form_sections")->onDelete("cascade");
            $table->foreignId("section_option_id")->nullable()->constrained()->onDelete("cascade");
            $table->string("answer_text")->nullable();
            $table->boolean("is_correct")->default(false);
            $table->string("score")->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('response_answers');
    }
};
