<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Retiro del prototipo (DEF-22, D-26, D-62): sus tablas dejan de usarse y liberan el nombre `offers` del
// diccionario (T36) para el Sprint 4. Las migraciones que las crearon no se editan; `users` se conserva.
// down() las recrea con el esquema de 000001, 000002 y 000004, vacías.
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('offers');
        Schema::dropIfExists('requests');
        Schema::dropIfExists('technicians');
        Schema::dropIfExists('api_tokens');
        Schema::dropIfExists('access_events');
    }

    public function down(): void
    {
        Schema::create('api_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('token_hash', 64)->unique();
            $table->timestamp('expires_at');
        });
        Schema::create('technicians', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->unique()->constrained();
            $table->string('zone');
            $table->json('zones');
            $table->json('specialties');
            $table->json('subcategories')->nullable();
            $table->decimal('fee', 10, 2);
            $table->decimal('rating', 9, 6)->default(0);
            $table->unsignedInteger('reviews')->default(0);
            $table->unsignedInteger('years')->default(0);
            $table->boolean('verified')->default(false);
            $table->boolean('available')->default(false);
        });
        Schema::create('requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('client_id')->constrained('users');
            $table->string('specialty');
            $table->string('subcategory')->nullable()->index();
            $table->string('zone');
            $table->string('address');
            $table->text('description');
            $table->string('status')->index();
            $table->uuid('technician_id')->nullable();
            $table->foreign('technician_id')->references('id')->on('technicians');
            $table->decimal('agreed_fee', 10, 2)->nullable();
            $table->unsignedTinyInteger('rating')->nullable();
            $table->bigInteger('created_ms');
            $table->bigInteger('pending_until');
            $table->bigInteger('completed_at')->nullable();
            $table->bigInteger('rating_until')->nullable();
            $table->json('events');
        });
        Schema::create('offers', function (Blueprint $table) {
            $table->id();
            $table->uuid('request_id');
            $table->foreign('request_id')->references('id')->on('requests')->cascadeOnDelete();
            $table->uuid('technician_id');
            $table->foreign('technician_id')->references('id')->on('technicians');
            $table->string('status');
            $table->bigInteger('sent_at');
            $table->bigInteger('expires_at')->index();
            $table->decimal('score', 9, 6);
            $table->unique(['request_id', 'technician_id']);
        });
        Schema::create('access_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->constrained('users');
            $table->foreignId('user_id')->constrained('users');
            $table->string('action');
            $table->timestamp('created_at');
        });
    }
};
