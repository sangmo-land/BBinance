<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register(): void
    {
\Illuminate\Support\Facades\Storage::fake('public');
        $response = $this->post('/register', [
'civility' => 'Mr.',
            'name' => 'Test',
            'surname' => 'User',
            'phone' => '1234567890',
            'spoken_language' => 'English',
            'profession' => 'Developer',
            'email' => 'test@example.com',
'country_of_residence' => 'USA',
            'date_of_birth' => '1990-01-01',
            'nationality' => 'American',
            'identity_card_front' => \Illuminate\Http\UploadedFile::fake()->create('front.jpg', 100),
            'identity_card_back' => \Illuminate\Http\UploadedFile::fake()->create('back.jpg', 100),
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

$this->assertGuest();
        $response->assertRedirect(route('login'));
    }
}
