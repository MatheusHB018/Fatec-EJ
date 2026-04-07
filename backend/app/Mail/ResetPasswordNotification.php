<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ResetPasswordNotification extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $resetLink) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: '[Fatec-EJ] Recupere Sua Senha');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.reset-password');
    }

    public function attachments(): array
    {
        return [];
    }
}
