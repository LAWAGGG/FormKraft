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
        Schema::table('form_sections', function (Blueprint $table) {
            $table->string('type')->default('essay')->change();
            $table->text('description')->nullable()->after('title');
            $table->string('image_path')->nullable()->after('description');
        });

        Schema::table('section_options', function (Blueprint $table) {
            $table->string('image_path')->nullable()->after('option_text');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('form_sections', function (Blueprint $table) {
            // Reverting to enum might be tricky depending on the DB, 
            // but for SQLite we can just leave it as string or try to change back.
            $table->enum('type', ['essay', 'option'])->default('essay')->change();
            $table->dropColumn(['description', 'image_path']);
        });

        Schema::table('section_options', function (Blueprint $table) {
            $table->dropColumn('image_path');
        });
    }
};
