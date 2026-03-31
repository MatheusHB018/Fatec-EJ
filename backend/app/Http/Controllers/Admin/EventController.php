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
        // return paginated list for admin
        return Event::orderBy('start_date', 'desc')->paginate(20);
    }

    // Public listing of active/upcoming events for the public site
    public function publicIndex()
    {
        // Public listing: return only currently active (ongoing) events
        // i.e. events that are marked active, with frontend showing seu status baseado nas datas
        // start_date and end_date serão usados pelo frontend para calcular se o evento está agendado, em andamento ou encerrado.
           $events = Event::where('is_active', '1')
              ->orderBy('start_date', 'asc')
              ->get();

        return response()->json(['events' => $events]);
    }

    public function store(Request $request)
    {
        // accept both 'type' and 'entry_type' from frontend
        $payload = $request->all();
        if (isset($payload['type']) && !isset($payload['entry_type'])) {
            $payload['entry_type'] = $payload['type'];
        }

    $data = $request->only(['title','description','start_date','end_date','location','entry_type','modality','category','price','quantity','valid_from','valid_to','pix_key','is_active']);

        $validator = Validator::make($data, [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
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

        if (isset($data['start_date']) && isset($data['end_date'])) {
            if (strtotime($data['start_date']) >= strtotime($data['end_date'])) {
                return response()->json(['message' => 'start_date must be before end_date'], 422);
            }
        }

        if (!empty($data['valid_from']) && !empty($data['valid_to'])) {
            if (strtotime($data['valid_from']) > strtotime($data['valid_to'])) {
                return response()->json(['message' => 'valid_from must be before or equal to valid_to'], 422);
            }
        }

        // if admin didn't explicitly set is_active, enable by default so new events appear on the public site
        if (!array_key_exists('is_active', $data)) {
            $data['is_active'] = true;
        }

        $event = Event::create($data);

        return response()->json(['message' => 'Event created', 'event' => $event], 201);
    }

    public function update(Request $request, Event $event)
    {
        $payload = $request->all();
        if (isset($payload['type']) && !isset($payload['entry_type'])) {
            $payload['entry_type'] = $payload['type'];
        }

    $data = $request->only(['title','description','start_date','end_date','location','entry_type','modality','category','price','quantity','valid_from','valid_to','pix_key','is_active']);

        $validator = Validator::make($data, [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
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

        if (isset($data['start_date']) && isset($data['end_date'])) {
            if (strtotime($data['start_date']) >= strtotime($data['end_date'])) {
                return response()->json(['message' => 'start_date must be before end_date'], 422);
            }
        }

        if (!empty($data['valid_from']) && !empty($data['valid_to'])) {
            if (strtotime($data['valid_from']) > strtotime($data['valid_to'])) {
                return response()->json(['message' => 'valid_from must be before or equal to valid_to'], 422);
            }
        }


        $event->update($data);

        return response()->json(['message' => 'Event updated', 'event' => $event]);
    }

    public function destroy(Event $event)
    {
        $event->delete();
        return response()->json(['message' => 'Event deleted']);
    }
}
