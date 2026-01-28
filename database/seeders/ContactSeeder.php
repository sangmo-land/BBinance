<?php

namespace Database\Seeders;

use App\Models\Contact;
use Illuminate\Database\Seeder;

class ContactSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Contact::updateOrCreate(
            ['email' => 'sangmo@mail.com'],
            [
                'email' => 'sangmo@mail.com',
                'phone' => '+33140701234',
                'office_name' => 'Paris Office',
                'street_address' => "103 Avenue des Champs-Élysées\n75008 Paris\nFrance",
                'is_active' => true,
            ]
        );
    }
}
