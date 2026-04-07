<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class FileController extends Controller
{
    public function showReceipt(string $filename): BinaryFileResponse
    {
        $safeFilename = basename($filename);
        $relativePath = 'receipts/' . $safeFilename;

        if (! Storage::disk('public')->exists($relativePath)) {
            abort(404);
        }

        return response()->file(storage_path('app/public/' . $relativePath));
    }
}