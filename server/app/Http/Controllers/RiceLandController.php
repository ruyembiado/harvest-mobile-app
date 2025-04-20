<?php

namespace App\Http\Controllers;

use Exception;
use App\Models\RiceLand;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RiceLandController extends Controller
{

    public function get_rice_land($id)
    {
        $land = RiceLand::with('riceVariety')->find($id);

        if (!$land) {
            return response()->json(['error' => 'Rice land not found'], 404);
        }

        return response()->json($land);
    }

    public function update_rice_land(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'rice_land_name' => 'required|string',
                'rice_land_lat' => 'required|string',
                'rice_land_long' => 'required|string',
                'rice_land_size' => 'nullable|string',
                'rice_land_size_sqm' => 'nullable|string',
                'rice_land_condition' => 'required|string',
                'rice_land_current_stage' => 'required|string',
            ]);

            $land = RiceLand::find($request->id);

            if (!$land) {
                return response()->json([
                    'error' => 'Rice land not found',
                ], 404);
            }

            $land->update([
                'user_id' => $request->user_id,
                'rice_land_name' => $validatedData['rice_land_name'],
                'rice_land_lat' => $validatedData['rice_land_lat'],
                'rice_land_long' => $validatedData['rice_land_long'],
                'rice_land_size' => $validatedData['rice_land_size'],
                'rice_land_size_sqm' =>  $validatedData['rice_land_size_sqm'],
                'rice_land_condition' => $validatedData['rice_land_condition'],
                'rice_land_current_stage' => $validatedData['rice_land_current_stage'],
            ]);

            return response()->json([
                'message' => 'Rice land updated successfully',
                'land' => $land,
            ], 200);
        } catch (Exception $ex) {
            return response()->json([
                'error' => $ex->getMessage(),
            ], 500);
        }
    }

    public function add_rice_land(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'rice_land_name' => 'required|string',
                'rice_land_lat' => 'required|string',
                'rice_land_long' => 'required|string',
                'rice_land_size' => 'nullable|string',
                'rice_land_size_sqm' => 'nullable|string',
                'rice_land_condition' => 'required|string',
                'rice_land_current_stage' => 'required|string',
            ]);

            $user = RiceLand::create([
                'user_id' => $request->user_id,
                'rice_land_name' => $validatedData['rice_land_name'],
                'rice_land_lat' => $validatedData['rice_land_lat'],
                'rice_land_long' => $validatedData['rice_land_long'],
                'rice_land_size' => $validatedData['rice_land_size'],
                'rice_land_size_sqm' =>  $validatedData['rice_land_size_sqm'],
                'rice_land_condition' => $validatedData['rice_land_condition'],
                'rice_land_current_stage' => $validatedData['rice_land_current_stage'],
            ]);

            return response()->json([
                'message' => 'Land rice added successfully',
                'user' => $user,
            ], 200);
        } catch (Exception $ex) {
            return response()->json([
                'error' => $ex->getMessage(),
            ], 500);
        }
    }

    public function get_rice_lands_by_user_id(Request $request)
    {
        try {
            $rice_lands = RiceLand::where('user_id', $request->user_id)->get();
            return response()->json([
                'message' => 'Retrieved all rice lands',
                'lands' => $rice_lands,
            ], 200);
        } catch (Exception $ex) {
            return response()->json([
                'error' => $ex->getMessage(),
            ], 500);
        }
    }

    public function delete_rice_land_by_id(Request $request)
    {
        try {
            $rice_land = RiceLand::where('id', $request->id)
                ->where('user_id', $request->user_id)
                ->first();

            if (!$rice_land) {
                return response()->json([
                    'error' => 'Rice land not found or does not belong to the user.',
                ], 404);
            }

            $rice_land->delete();

            return response()->json([
                'message' => 'Rice land deleted successfully.',
            ], 200);
        } catch (Exception $ex) {
            return response()->json([
                'error' => $ex->getMessage(),
            ], 500);
        }
    }

    public function update_rice_land_stage(Request $request)
    {
        $request->validate([
            'today' => 'required|date',
            'id' => 'required|integer|exists:rice_lands,id',
        ]);

        $riceLand = DB::table('rice_lands')->where('id', $request->id)->first();

        if (!$riceLand) {
            return response()->json([
                'status' => 'error',
                'message' => 'Rice land not found.',
            ], 404);
        }

        $stage = DB::table('rice_growth_stages')
            ->where('rice_land_id', $riceLand->id)
            ->where('rice_growth_stage_start', '<=', $request->today)
            ->where('rice_growth_stage_end', '>=', $request->today)
            ->first();

        if (!$stage) {
            return response()->json([
                'status' => 'error',
                'message' => 'No matching growth stage found for today.',
                'debug_stage' => json_encode($stage) // ✅ Debugging
            ], 404);
        }

        $updated = DB::table('rice_lands')
            ->where('id', $request->id)
            ->update(['rice_land_current_stage' => $stage->rice_growth_stage]);

        if ($updated === 0) {
            return response()->json([
                'status' => 'warning',
                'message' => 'Rice land stage is already up-to-date.',
            ], 200);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Rice land stage updated successfully.',
            'new_stage' => $stage->rice_growth_stage,
            'stage_start' => $stage->rice_growth_stage_start,
            'stage_end' => $stage->rice_growth_stage_end
        ]);
    }
}
