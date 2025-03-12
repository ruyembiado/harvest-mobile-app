<?php

namespace App\Http\Controllers;

use Exception;
use Carbon\Carbon;
use App\Models\Advisory;
use Illuminate\Http\Request;
use App\Models\RiceGrowthStages;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\Http;

class AICoontroller extends Controller
{
    public function generate_stage_growth_schedule(Request $request)
    {
        $crop_type = $request->rice_variety_name;
        $rice_land_id = $request->rice_land_id;
        $planting_date = $request->planting_date;

        $prompt = "You are an Agriculture Expert. Today is $planting_date, and I just planted my $crop_type crop. The following are the stages of rice growth of $crop_type: 
    Germination, Seeding Establishment, Tillering, Panicle Initiation, Booting, Heading, Flowering, Grain Filling, and Maturity. 
    Please create a schedule for each stage with a start date and an end date.
    Format your response as a JSON array where each object contains:
    - 'rice_growth_stage': (string) name of the stage,
    - 'rice_growth_stage_start': (string) YYYY-MM-DD start date,
    - 'rice_growth_stage_end': (string) YYYY-MM-DD end date.
    
    ONLY return pure JSON, no explanations, no extra text.";

        try {
            // Call OpenAI API
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . env('OPENAI_API_KEY'),
                'Content-Type' => 'application/json',
            ])->timeout(30)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => 'gpt-3.5-turbo',
                    'messages' => [
                        ['role' => 'system', 'content' => 'You are a helpful assistant.'],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    'max_tokens' => 500,
                    'temperature' => 0.7,
                ]);

            // Check API success response
            if ($response->successful()) {
                $data = $response->json();

                // Log entire OpenAI response
                Log::info('OpenAI Response:', $data);

                // Ensure response contains valid choices
                if (!isset($data['choices'][0]['message']['content'])) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'No valid response from AI.',
                    ], 500);
                }

                $generatedText = $data['choices'][0]['message']['content'];

                // Log raw AI response before JSON parsing
                // \Log::info('AI Raw Response (Before JSON Decode):', ['response' => $generatedText]);

                // **Fix: Remove Markdown formatting** (Improved regex)
                $generatedText = preg_replace('/^```json\s*|\s*```$/', '', trim($generatedText));

                // Ensure response is not empty
                if (empty($generatedText)) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'AI response is empty.',
                    ], 500);
                }

                // Decode JSON response
                $stages = json_decode($generatedText, true);

                // **Validate JSON decoding**
                if (json_last_error() !== JSON_ERROR_NONE) {
                    // \Log::error('JSON Decode Error:', ['error' => json_last_error_msg()]);
                    return response()->json([
                        'status' => 'error',
                        'message' => 'JSON decoding failed: ' . json_last_error_msg(),
                    ], 500);
                }

                $this->store_generated_growth_stages($rice_land_id, $stages);

                // Log parsed JSON
                // \Log::info('Parsed AI Response:', $stages);

                // Pass data to Blade view
                return response()->json([
                    'status' => 'success',
                    'message' => 'Growth stage schedule generated successfully.',
                ], 200);
            } else {
                // Log API errors
                // \Log::error('OpenAI API Error:', $response->json());

                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to generate text from OpenAI API.',
                ], 500);
            }
        } catch (\Exception $e) {
            // Log exceptions
            // \Log::error('Exception:', ['message' => $e->getMessage()]);

            return response()->json([
                'status' => 'error',
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function store_generated_growth_stages($rice_land_id, $stages)
    {
        foreach ($stages as $stage) {
            RiceGrowthStages::create([
                'rice_land_id' => $rice_land_id,
                'rice_growth_stage' => $stage['rice_growth_stage'],
                'rice_growth_stage_start' => $stage['rice_growth_stage_start'],
                'rice_growth_stage_end' => $stage['rice_growth_stage_end'],
            ]);
        }
    }

    public function generate_advisories(Request $request)
    {
        $current_date = Carbon::now();

        $date = $request->date;
        $rice_land_id = $request->rice_land_id;
        $rice_land_size = $request->rice_land_size;
        $rice_land_condition = $request->rice_land_condition;
        $rice_land_current_stage = $request->rice_land_current_stage;
        $rice_variety = $request->rice_variety;
        $weatherData = json_encode($request->weatherData); // Ensure valid JSON

        // AI Prompt (Modified to return an array)
        $prompt = "You are an Agriculture Expert. Give advisories as an array based on the following rice land data: 
    Land size: {$rice_land_size} hectares,
    Land condition: {$rice_land_condition},
    Rice growth stage: {$rice_land_current_stage},
    Rice variety: {$rice_variety},
    Weather temperature: {$weatherData} degree celsius.

    ONLY return the JSON, no extra text, no explanations.";

        try {
            // Call OpenAI API
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . env('OPENAI_API_KEY'),
                'Content-Type' => 'application/json',
            ])->timeout(30)->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-3.5-turbo',
                'messages' => [
                    ['role' => 'system', 'content' => 'You are a helpful assistant.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'max_tokens' => 500,
                'temperature' => 0.7,
            ]);

            // Check if OpenAI API request was successful
            if (!$response->successful()) {
                Log::error('OpenAI API Error:', $response->json());
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to generate advisory from OpenAI API.',
                ], 500);
            }

            // Extract AI response
            $data = $response->json();
            if (!isset($data['choices'][0]['message']['content'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No valid response from AI.',
                ], 500);
            }

            $generatedText = $data['choices'][0]['message']['content'];

            // Log AI response for debugging
            Log::info('Raw AI Response:', ['response' => $generatedText]);

            // **Fix: Remove Markdown formatting (if any)**
            $generatedText = preg_replace('/^```json\s*|\s*```$/', '', trim($generatedText));

            // Validate non-empty response
            if (empty($generatedText)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'AI response is empty.',
                ], 500);
            }

            // Decode JSON response
            $advisories = json_decode($generatedText, true);

            // Check for JSON errors
            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('JSON Decode Error:', ['error' => json_last_error_msg()]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid JSON response from AI: ' . json_last_error_msg(),
                ], 500);
            }

            // Check if the provided date matches the current date
            if (Carbon::parse($date)->toDateString() === $current_date->toDateString()) {
                // Ensure date is formatted correctly before storing
                $formattedDate = Carbon::parse($date)->format('Y-m-d');
                // Store advisories in the database
                $this->store_generated_advisories($rice_land_id, $advisories, $formattedDate);

                return response()->json([
                    'status' => 'success',
                    'message' => 'Advisories generated and saved successfully.',
                    'advisories' => $advisories, // Return advisories for confirmation
                ], 200);
            } else {
                // If the date is not today, return the advisories without saving
                return response()->json([
                    'status' => 'success',
                    'message' => 'Advisories generated successfully.',
                    'advisories' => $advisories,
                ], 200);
            }
        } catch (\Exception $e) {
            Log::error('Exception in generate_advisories:', ['message' => $e->getMessage()]);
            return response()->json([
                'status' => 'error',
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function store_generated_advisories($rice_land_id, $advisories, $date)
    {
        Advisory::create([
            'rice_land_id' => $rice_land_id,
            'advisories' => json_encode($advisories),
            'date' => $date,
        ]);
    }

    public function ask_question(Request $request)
    {
        $question = trim($request->question);

        if (empty($question)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Question cannot be empty.',
            ], 400);
        }

        $prompt = "You are an Agriculture Expert. I want to ask: $question?";

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . env('OPENAI_API_KEY'),
                'Content-Type' => 'application/json',
            ])->timeout(30)->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-3.5-turbo',
                'messages' => [
                    ['role' => 'system', 'content' => 'You are a helpful assistant.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'max_tokens' => 500,
                'temperature' => 0.7,
            ]);

            if (!$response->successful()) {
                Log::error('OpenAI API Error:', ['response' => $response->json()]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Failed to generate response from AI.',
                ], 500);
            }

            $data = $response->json();

            // Ensure response contains choices
            if (!isset($data['choices'][0]['message']['content'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'No valid response from AI.',
                ], 500);
            }

            $generatedText = $data['choices'][0]['message']['content'];

            // Remove possible Markdown artifacts
            $generatedText = preg_replace('/^```(?:json)?\s*|\s*```$/', '', trim($generatedText));

            return response()->json([
                'status' => 'success',
                'message' => 'Answer generated successfully.',
                'data' => $generatedText,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Exception:', ['message' => $e->getMessage()]);

            return response()->json([
                'status' => 'error',
                'message' => 'An error occurred: ' . $e->getMessage(),
            ], 500);
        }
    }
}
