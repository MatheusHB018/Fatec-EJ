<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EventController extends Controller
{
    public function index()
    {
        return Event::withCount('registrations')
            ->orderBy('start_date', 'desc')
            ->get();
    }

    // Public listing of active/upcoming events for the public site
    public function publicIndex()
    {
        try {
            $events = Event::where('is_active', true)
                ->orderBy('start_date', 'asc')
                ->get();

            return response()->json($events);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([]);
        }
    }

    public function store(Request $request)
    {
        if ($request->has('type') && !$request->has('entry_type')) {
            $request->merge(['entry_type' => $request->input('type')]);
        }

        $data = $request->only(['title','description','start_date','end_date','location','entry_type','modality','category','price','quantity','valid_from','valid_to','pix_key','is_active']);

        $validator = Validator::make($data, [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'location' => 'nullable|string|max:255',
            'entry_type' => 'nullable|in:gratuita,paga,doacao',
            'modality' => 'nullable|string',
            'category' => 'nullable|string|max:255',
            'price' => 'nullable|numeric',
            'quantity' => 'nullable|integer|min:0',
            'valid_from' => 'nullable|date',
            'valid_to' => 'nullable|date',
            'pix_key' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        if (!empty($data['valid_from']) && !empty($data['valid_to'])) {
            if (strtotime($data['valid_from']) > strtotime($data['valid_to'])) {
                return response()->json(['message' => 'valid_from must be before or equal to valid_to'], 422);
            }
        }

        // Build course_schedules from paired arrays, ignoring incomplete entries
        $startDates = $request->input('course_start_dates', []);
        $endDates   = $request->input('course_end_dates', []);
        $schedules  = [];
        foreach ($startDates as $i => $start) {
            $end = $endDates[$i] ?? null;
            if (!empty($start) && !empty($end)) {
                $schedules[] = ['start' => $start, 'end' => $end];
            }
        }
        $data['course_schedules'] = !empty($schedules) ? $schedules : null;

        // if admin didn't explicitly set is_active, enable by default so new events appear on the public site
        if (!array_key_exists('is_active', $data)) {
            $data['is_active'] = true;
        }

        $event = Event::create($data);

        return response()->json(['message' => 'Event created', 'event' => $event], 201);
    }

    public function update(Request $request, Event $event)
    {
        if ($request->has('type') && !$request->has('entry_type')) {
            $request->merge(['entry_type' => $request->input('type')]);
        }

        $data = $request->only(['title','description','start_date','end_date','location','entry_type','modality','category','price','quantity','valid_from','valid_to','pix_key','is_active']);

        $validator = Validator::make($data, [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'location' => 'nullable|string|max:255',
            'entry_type' => 'nullable|in:gratuita,paga,doacao',
            'modality' => 'nullable|string',
            'category' => 'nullable|string|max:255',
            'price' => 'nullable|numeric',
            'quantity' => 'nullable|integer|min:0',
            'valid_from' => 'nullable|date',
            'valid_to' => 'nullable|date',
            'pix_key' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        if (!empty($data['valid_from']) && !empty($data['valid_to'])) {
            if (strtotime($data['valid_from']) > strtotime($data['valid_to'])) {
                return response()->json(['message' => 'valid_from must be before or equal to valid_to'], 422);
            }
        }

        // Build course_schedules from paired arrays, ignoring incomplete entries
        $startDates = $request->input('course_start_dates', []);
        $endDates   = $request->input('course_end_dates', []);
        $schedules  = [];
        foreach ($startDates as $i => $start) {
            $end = $endDates[$i] ?? null;
            if (!empty($start) && !empty($end)) {
                $schedules[] = ['start' => $start, 'end' => $end];
            }
        }
        $data['course_schedules'] = !empty($schedules) ? $schedules : null;

        $event->update($data);

        return response()->json(['message' => 'Event updated', 'event' => $event]);
    }

    public function destroy(Event $event)
    {
        $event->delete();
        return response()->json(['message' => 'Event deleted']);
    }
}
