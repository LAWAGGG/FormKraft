<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('form_sections', function (Blueprint $table) {
            $table->text('visibility_rules')->nullable()->after('is_quiz');
        });
    }

    public function down(): void
    {
        Schema::table('form_sections', function (Blueprint $table) {
            $table->dropColumn('visibility_rules');
        });
    }
};
