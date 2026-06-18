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
        Schema::table('forms', function (Blueprint $table) {
            $table->string('thank_you_title')->nullable()->after('description');
            $table->text('thank_you_message')->nullable()->after('thank_you_title');
        });

        Schema::table('form_sections', function (Blueprint $table) {
            $table->boolean('is_page_break')->default(false)->after('is_quiz');
        });

        Schema::table('section_options', function (Blueprint $table) {
            $table->unsignedBigInteger('logic_target_section_id')->nullable()->after('image_path');
            $table->foreign('logic_target_section_id')->references('id')->on('form_sections')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('section_options', function (Blueprint $table) {
            $table->dropForeign(['logic_target_section_id']);
            $table->dropColumn('logic_target_section_id');
        });

        Schema::table('form_sections', function (Blueprint $table) {
            $table->dropColumn('is_page_break');
        });

        Schema::table('forms', function (Blueprint $table) {
            $table->dropColumn(['thank_you_title', 'thank_you_message']);
        });
    }
};
